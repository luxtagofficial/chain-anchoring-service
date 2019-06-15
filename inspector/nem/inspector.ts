import { parse } from 'url';
import grpc from 'grpc';
import * as nemSDK from 'nem-sdk';
import * as services from './_proto/anchor_grpc_pb';
import * as messages from './_proto/anchor_pb';

const nem = nemSDK.default;

export interface IInspectorOptions {
  endpoint: string;
  skipper: string;

  address: string;
}

function hextoUint8Arr(hexx: string): Uint8Array {
  const hex = hexx.toString(); // force conversion
  const ua = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    ua[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return ua;
}

export class Inspector {

  private opts: IInspectorOptions;
  private endpoint: any;
  private skipper: services.InspectClient;

  public constructor(opts: IInspectorOptions) {
    this.opts = opts;

    let { protocol, hostname, port } = parse(this.opts.endpoint as string)
    if (!hostname) {
      throw new Error(`invalid endpoint`);
    }

    this.endpoint = nem.model.objects.create('endpoint')(protocol + '//' + hostname, port);
    this.skipper = new services.InspectClient(this.opts.skipper, grpc.credentials.createInsecure());
  }

  public async fetchAnchors() {
    try {
      const txs = await nem.com.requests.account.transactions.all(this.endpoint, this.opts.address)
      console.log("txs:", txs)
      if (!txs.length) {
        return []
      }

      let lockList: messages.Lock[] = []
      await Promise.all(txs.data.map((tx) => {
        console.log('fetchAnchors:', tx)
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

      const locks = lockList.filter((lock) => lock.getBlock()!.getHeight() !== '');
      console.log(`Found ${locks.length} anchors`);
      for (const lock of locks) {
        console.log(`Verifying block at height ${lock.getBlock()!.getHeight()}`);
        await this.verifyLock(lock);
      }
    } catch (e) {
      console.log("[ERROR] 'fetchAnchors' failed:", e)
    }
    return []
  }

  private verifyLock(lock: messages.Lock): Promise<boolean> {
    const block = lock.getBlock();
    const header = new messages.Header();
    header.setHeight(parseInt(block!.getHeight(), 10));
    header.setType(lock.getType());
    return new Promise((resolve, reject) => {
      this.skipper.block(header, (err, resp) => {
        if (err) {
          reject(err);
        }

        if (!resp) {
          throw new Error("upstream returns undefined response. is the service online?")
        }

        const block2 = resp.getBlock();
        if (block!.getHeight() === block2!.getHeight()) {
          if (block!.getHash() === block2!.getHash()) {
            console.log(`Height ${block!.getHeight()}: Verified`);
            resolve(true);
          } else {
            console.log(`Height ${block!.getHeight()}: Invalid`);
            resolve(false);
          }
        }
      });
    });
  }
}
