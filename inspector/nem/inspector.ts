import fetch from 'node-fetch';
import { parse } from 'url';
import grpc from 'grpc';
import * as nemSDK from 'nem-sdk';
import * as services from './_proto/anchor_grpc_pb';
import * as messages from './_proto/anchor_pb';
import { useRestSkipper } from '../useRestSkipper';
import { InspectorContract, InspectedAnchor, ErrorObject, PAGE_SIZE } from '../types';
import { sortAnchors } from '../utils'

const nem = nemSDK.default;

export type InspectorArgs = InspectorContract & {
  address: string
}

function hextoUint8Arr(hexx: string): Uint8Array {
  const hex = hexx.toString(); // force conversion
  const ua = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    ua[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return ua;
}

const handleUpstreamMissingKey = (key: string, jsonResponse: object) => {
  return {
    error: `upstream returns unexpected response: '.${key}' key is missing.`,
    details: [
      { jsonResponse },
    ]
  }
}

export class Inspector {
  private args: InspectorArgs;
  private island: any;
  private skipper: services.InspectClient | any;
  private useRestSkipper: boolean;
  private reUint = /^[1-9][0-9]{0,}$/

  public constructor(args: InspectorArgs) {
    this.args = args;

    let { protocol, hostname, port } = parse(this.args.island as string)
    if (!hostname) {
      throw new Error(`invalid island`);
    }

    this.island = nem.model.objects.create('endpoint')(protocol + '//' + hostname, port);
    
    this.useRestSkipper = this.args.skipper.startsWith('http')
    if (this.useRestSkipper) {
      this.skipper = useRestSkipper(this.args.skipper)
    } else {
      this.skipper = new services.InspectClient(this.args.skipper, grpc.credentials.createInsecure());
    }
  }

  public static async chainInfo(endpoint: string) {
    const [ respBlock2, respHeight] = await Promise.all([
      fetch(endpoint + '/block/at/public', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          height: 2
        })
      }).then(resp => resp.json()),
      fetch(endpoint + '/chain/height').then(resp => resp.json())
    ])

    if (!respBlock2.prevBlockHash) {
      return handleUpstreamMissingKey('prevBlockHash', respBlock2)
    }

    if (!respHeight.height) {
      return handleUpstreamMissingKey('height', respHeight)
    }

    return {
      genesisHash: respBlock2.prevBlockHash.data,
      currentBlockHeight: respHeight.height,
    }
  }

  public async fetchAnchors(offset?: string): Promise<InspectedAnchor[] | ErrorObject> {
      let anchors: InspectedAnchor[] = []
      let iter = 0

      if (offset && !this.reUint.test(offset)) {
        return {
          error: 'offset must be integer greater than 0',
          code: 'E_INVALID_ANCHOR_OFFSET'
        }
      }

      let lastTxID = Number.parseInt(offset)
      while (anchors.length < PAGE_SIZE) {
        const resp = await nem.com.requests.account.transactions.all(this.island, this.args.address, null, lastTxID)
        if (!resp.data) {
          throw new Error('unexpected response from endpoint:' + JSON.stringify(resp));
        }

        // break the loop if there's no more data from upstream
        if (!resp.data.length) {
          console.log("[INFO] `fetchTxs` completed: no more data from upstream")
          break
        }

        // map offset id and lock list. for nem 1,
        // `meta.id` is used as offset id.
        let lockList: { [key: string]: messages.Lock[] } = {}

        resp.data.forEach((tx) => {
          const messageObj = tx.transaction.message;
          if (messageObj && messageObj.payload) {
            try {
              const anchor = messages.Anchor.deserializeBinary(hextoUint8Arr(messageObj.payload));
              // Ignore anchor with no locks
              if (anchor.getLocksList().length !== 0) {
                lockList[tx.meta.id] = anchor.getLocksList();
              }
            } catch (e) { /* Ignore messages that cannot be parsed */ }
          }
        });

        let anchorsFound: InspectedAnchor[] = []
        for (const offsetID in lockList) {
          for (const lock of lockList[offsetID]) {
            const jsonLock = JSON.stringify(lock.toObject())

            const block = lock.getBlock()!
            const height = block.getHeight()
            if (height) {
              const valid = await this.verifyLock(lock);
              anchorsFound.push({
                hash: block.getHash(),
                height,
                offsetID,
                valid,
              })
            } else {
              console.log("[WARN] lock with no height won't be considered as anchor. lock:", JSON.stringify(lock.toObject()))
            }
          }
        }

        lastTxID = resp.data[resp.data.length - 1].meta.id
        iter++

        anchors = [...anchors, ...anchorsFound]
        console.log(`[INFO] found ${anchorsFound.length} anchor(s) in iter #${iter}. total anchors: ${anchors.length}`)
      }

      return sortAnchors(anchors)
  }

  private async verifyLock(lock: messages.Lock): Promise<boolean> {
    const island = lock.getBlock()!.toObject();
    const header = new messages.Header();
    header.setHeight(parseInt(island.height, 10));
    header.setType(lock.getType())

    if (this.useRestSkipper) {
      try {
        const ship = await this.skipper.fetchRest(island.height);
        if (island.height === ship.height) {
          return island.hash === ship.hash
        }
        console.log("[WARN] HEIGHT NOT SAME", {ship, island})
        return false
      } catch (e) {
        console.log("[ERROR] `verifyLock` failed:", e)
        return false
      }
    }

    return new Promise((resolve, reject) => {
      this.skipper.block(header, (err, resp) => {
        if (err) {
          reject(err);
        }

        if (!resp) {
          throw new Error("upstream returns undefined response. is the service online?")
        }

        const ship = resp.getBlock()!.toObject();
        if (island.height === ship.height) {
          resolve(island.hash === ship.hash);
        }
      });
    });
  }
}
