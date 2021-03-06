import grpc from 'grpc';
import * as nemSDK from 'nem-sdk';
import fetch from 'node-fetch';
import { parse } from 'url';
import { ErrorObject, InspectedAnchor, InspectorContract, InspectorLock, PAGE_SIZE } from '../types';
import { useRestSkipper } from '../useRestSkipper';
import { logger, sortAnchors } from '../utils';
import * as services from '../_proto/anchor_grpc_pb';
import * as messages from '../_proto/anchor_pb';

const nem = nemSDK.default;

export type InspectorArgs = InspectorContract & {
  address: string,
};

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
    ],
  };
};

export class Inspector {

  public static async chainInfo(endpoint: string) {
    const [ respBlock2, respHeight] = await Promise.all([
      fetch(endpoint + '/block/at/public', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          height: 2,
        }),
      }).then((resp) => resp.json()),
      fetch(endpoint + '/chain/height').then((resp) => resp.json()),
    ]);

    if (!respBlock2.prevBlockHash) {
      return handleUpstreamMissingKey('prevBlockHash', respBlock2);
    }

    if (!respHeight.height) {
      return handleUpstreamMissingKey('height', respHeight);
    }

    return {
      genesisHash: respBlock2.prevBlockHash.data,
      currentBlockHeight: respHeight.height,
    };
  }
  private args: InspectorArgs;
  private island: any;
  private skipper: services.InspectClient | any;
  private useRestSkipper: boolean;

  // any integer greater than 0
  private reOffsetID = /^[1-9][0-9]{0,}$/;

  public constructor(args: InspectorArgs) {
    this.args = args;

    const { protocol, hostname, port } = parse(this.args.island as string);
    if (!hostname) {
      throw new Error(`invalid island`);
    }

    this.island = nem.model.objects.create('endpoint')(protocol + '//' + hostname, port);

    this.useRestSkipper = this.args.skipper.startsWith('http');
    if (this.useRestSkipper) {
      this.skipper = useRestSkipper(this.args.skipper);
    } else {
      this.skipper = new services.InspectClient(this.args.skipper, grpc.credentials.createInsecure());
    }
  }

  public async fetchAnchors(offset?: string): Promise<InspectedAnchor[] | ErrorObject> {
      let anchors: InspectedAnchor[] = [];
      let iter = 0;

      if (offset && !this.reOffsetID.test(offset)) {
        return {
          error: 'offset must be integer greater than 0',
          code: 'E_INVALID_ANCHOR_OFFSET',
        };
      }

      let lastTxID = Number.parseInt(offset || '', 10);
      while (anchors.length < PAGE_SIZE) {
        const resp = await nem.com.requests.account.transactions.all(this.island, this.args.address, null, lastTxID);
        if (!resp.data) {
          throw new Error('unexpected response from endpoint:' + JSON.stringify(resp));
        }

        const txs = resp.data;
        // break the loop if there's no more data from upstream
        if (!txs.length) {
          logger.warn('[INFO] `fetchAnchors` completed: no more data from upstream');
          break;
        }

        const locks: InspectorLock[] = [];
        txs.forEach((tx) => {
          const messageObj = tx.transaction.message;
          if (messageObj && messageObj.payload) {
            try {
              const anchor = messages.Anchor.deserializeBinary(hextoUint8Arr(messageObj.payload));
              // Ignore anchor with no locks
              if (anchor.getLocksList().length !== 0) {
                locks.push({
                  offsetID: tx.meta.id.toString(),
                  txHash: tx.meta.hash.data,
                  lockList: anchor.getLocksList(),
                });
              }
            } catch (e) {
              logger.warn(`'messages.Anchor.deserializeBinary' failed: ${e.message}. tx: ${JSON.stringify(tx)}`);
            }
          }
        });

        const anchorsFound: InspectedAnchor[] = [];
        for (const { offsetID, txHash, lockList } of locks) {
          for (const lock of lockList) {
            if ((anchors.length + anchorsFound.length) >= PAGE_SIZE) {
              break;
            }

            const block = lock.getBlock()!;
            const height = block.getHeight();
            if (height) {
              const valid = await this.verifyLock(lock);
              anchorsFound.push({
                hash: block.getHash(),
                height,
                valid,
                island: {
                  offsetID,
                  txHash,
                },
              });
            } else {
              logger.warn(`lock with no height won't be considered as anchor: ${JSON.stringify(lock.toObject())}`);
            }
          }
        }

        lastTxID = txs[txs.length - 1].meta.id;
        iter++;

        anchors = [...anchors, ...anchorsFound];
        logger.info(`found ${anchorsFound.length} anchor(s) across ${txs.length} txs in iter #${iter}. total anchors: ${anchors.length}`);
      }

      return sortAnchors(anchors);
  }

  private async verifyLock(lock: messages.Lock): Promise<boolean> {
    const island = lock.getBlock()!.toObject();
    const header = new messages.Header();
    header.setHeight(parseInt(island.height, 10));
    header.setType(lock.getType());

    if (this.useRestSkipper) {
      try {
        const ship = await this.skipper.fetchRest(island.height);
        if (island.height === ship.height) {
          return island.hash === ship.hash;
        }
        logger.warn('HEIGHT NOT SAME', {ship, island});
        return false;
      } catch (e) {
        logger.warn('`verifyLock` failed:', e);
        return false;
      }
    }

    return new Promise((resolve, reject) => {
      this.skipper.block(header, (err, resp) => {
        if (err) {
          reject(err);
        }

        if (!resp) {
          throw new Error('upstream returns undefined response. is the service online?');
        }

        const ship = resp.getBlock()!.toObject();
        if (island.height === ship.height) {
          resolve(island.hash === ship.hash);
        }
      });
    });
  }
}
