import fetch from 'node-fetch';
import { parse } from 'url';
import grpc from 'grpc';
import * as nemSDK from 'nem-sdk';
import * as services from './_proto/anchor_grpc_pb';
import * as messages from './_proto/anchor_pb';
import { useRestSkipper } from '../useRestSkipper';

const nem = nemSDK.default;

export interface IInspectorOptions {
  island: string;
  skipper: string;

  address: string;
}

export type InspectedAnchor = {
  height: string;
  hash: string;
  valid: boolean;
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
  private opts: IInspectorOptions;
  private island: any;
  private skipper: services.InspectClient | any;
  private useRestSkipper: boolean;

  public constructor(opts: IInspectorOptions) {
    this.opts = opts;

    let { protocol, hostname, port } = parse(this.opts.island as string)
    if (!hostname) {
      throw new Error(`invalid island`);
    }

    this.island = nem.model.objects.create('endpoint')(protocol + '//' + hostname, port);
    
    this.useRestSkipper = this.opts.skipper.startsWith('http')
    if (this.useRestSkipper) {
      this.skipper = useRestSkipper(this.opts.skipper)
    } else {
      this.skipper = new services.InspectClient(this.opts.skipper, grpc.credentials.createInsecure());
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

  public async fetchAnchors() {
      const txs = await nem.com.requests.account.transactions.all(this.island, this.opts.address)
      if (!txs.data) {
        throw new Error('unexpected response from endpoint:' + JSON.stringify(txs));
      }

      let lockList: messages.Lock[] = []
      await Promise.all(txs.data.map((tx) => {
        const messageObj = tx.transaction.message;
        if (messageObj && messageObj.payload) {
          try {
            const anchor = messages.Anchor.deserializeBinary(hextoUint8Arr(messageObj.payload));
            // Ignore anchor with no locks
            if (anchor.getLocksList().length !== 0) {
              lockList = lockList.concat(anchor.getLocksList());
            }
          } catch (e) {
            // Ignore messages that cannot be parsed
          }
        }
      }));

      let anchors: InspectedAnchor[] = []
      const locks = lockList.filter((lock) => lock.getBlock()!.getHeight() !== '');
      
      for (const lock of locks) {
        const block = lock.getBlock()!
        const height = block.getHeight()
        if (height) {
          const valid = await this.verifyLock(lock);
          anchors.push({
            height,
            hash: block.getHash(),
            valid
          })
        }
      }

      return anchors
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
        console.log("fetchRest error:", e)
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
