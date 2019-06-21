/*
 *
 * Copyright 2019 Luxtag Sdn.Bhd. (Malaysia)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import fetch from 'node-fetch';
import grpc from 'grpc';
import {
  AccountHttp,
  NetworkType,
  PublicAccount,
  QueryParams,
  TransferTransaction
} from 'nem2-sdk';
import { EMPTY } from 'rxjs';
import { concatMap, expand } from 'rxjs/operators';
import * as services from '../_proto/anchor_grpc_pb';
import * as messages from '../_proto/anchor_pb';
import { useRestSkipper } from '../useRestSkipper';
import { InspectorContract, InspectorLock, InspectedAnchor, ErrorObject, PAGE_SIZE } from '../types';
import { sortAnchors } from '../utils'

export type InspectorArgs = InspectorContract & {
  publicKey: string;
  networkType: string;
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
  private skipper: services.InspectClient | any;
  private accountHttp: AccountHttp;
  private publicAccount: PublicAccount;
  private useRestSkipper: boolean;

  // offset id is 24 chars of mongo's object id.
  // example: 5CCC11E08C73D400016CA264
  private reOffsetID = /^[A-Z0-9]{24}$/

  public constructor(args: InspectorArgs) {
    this.args = args;

    this.useRestSkipper = this.args.skipper.startsWith('http')
    if (this.useRestSkipper) {
      this.skipper = useRestSkipper(this.args.skipper)
    } else {
      this.skipper = new services.InspectClient(this.args.skipper, grpc.credentials.createInsecure());
    }

    this.accountHttp = new AccountHttp(this.args.island);

    try {
      const networkType = getNetwork(this.args.networkType);
      this.publicAccount = PublicAccount.createFromPublicKey(this.args.publicKey, networkType);
    } catch (e) {
      console.log(e);
      throw Error('NEM address is not valid');
    }
  }

  public static async chainInfo(endpoint: string) {
    const [ jsonBlock1, jsonDiagnostic ] = await Promise.all([
      fetch(endpoint + '/block/1').then(resp => resp.json()),
      fetch(endpoint + '/diagnostic/storage').then(resp => resp.json()),
    ])

    if (!jsonBlock1.meta) {
      return handleUpstreamMissingKey('meta', jsonBlock1)
    }

    if (!jsonDiagnostic.numBlocks) {
      return handleUpstreamMissingKey('numBlocks', jsonBlock1)
    }

    return {
      genesisHash: jsonBlock1.meta.hash,
      currentBlockHeight: jsonDiagnostic.numBlocks,
    }
  }

  public async fetchAnchors(offset?: string) {
    const pageSize: number = 100;

    offset = offset ? offset.toUpperCase() : undefined
    if (offset && !this.reOffsetID.test(offset)) {
      return {
        error: "NEM2 offset must be 24 chars long of mongo's object ID.",
        code: 'E_INVALID_ANCHOR_OFFSET'
      }
    }

    let iter = 0
    let lastTxID = offset
    let anchors: InspectedAnchor[] = []
    while (anchors.length < PAGE_SIZE) {
      const queryParams = new QueryParams(pageSize, lastTxID);
      const txs = await this.accountHttp.transactions(this.publicAccount, queryParams).toPromise();
      
      // break the loop if there's no more data from upstream
      if (!txs.length) {
        console.log("[INFO] `fetchAnchors` completed: no more data from upstream")
        break
      }

      let locks: InspectorLock[] = []
      for (const tx of txs) {
        if (tx instanceof TransferTransaction) {
          try {
            const anchor = messages.Anchor.deserializeBinary(str2arr(tx.message.payload));
            // Ignore anchor with no locks
            if (anchor.getLocksList().length !== 0) {
              locks.push({
                offsetID: tx.transactionInfo.id,
                txHash: tx.transactionInfo.hash,
                lockList: anchor.getLocksList(),
              })
            }
          } catch (e) {
            console.log(
              `[ERROR] 'messages.Anchor.deserializeBinary' failed: ${e.message}. tx:\n`, 
              JSON.stringify(tx),
            )
          }
        }
      }

      let anchorsFound: InspectedAnchor[] = []
      for (const { offsetID, txHash, lockList } of locks) {
        for (const lock of lockList) {
          const block = lock.getBlock()!
          const height = block.getHeight()
          if (height) {
            const valid = await this.verifyLock(lock);
            anchorsFound.push({
              hash: block.getHash(),
              height,
              valid,
              island: {
                offsetID,
                txHash,
              }
            })
          } else {
            console.log("[WARN] lock with no height won't be considered as anchor. lock:", JSON.stringify(lock.toObject()))
          }
        }
      }

      lastTxID = txs[txs.length - 1].transactionInfo.id
      iter++

      anchors = [...anchors, ...anchorsFound]
      console.log(`[INFO] found ${anchorsFound.length} anchor(s) across ${txs.length} txs in iter #${iter}. total anchors: ${anchors.length}`)
    }

    return anchors;
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

function str2arr(str) {
  const utf8 = unescape(encodeURIComponent(str));
  return new Uint8Array(utf8.split('').map((item) => {
    return item.charCodeAt(0);
  }));
}

function getNetwork(network: string): NetworkType {
  if (network === 'MAIN_NET') {
    return NetworkType.MAIN_NET;
  } else if (network === 'TEST_NET') {
    return NetworkType.TEST_NET;
  } else if (network === 'MIJIN') {
    return NetworkType.MIJIN;
  } else if (network === 'MIJIN_TEST') {
    return NetworkType.MIJIN_TEST;
  }
  throw new Error('Introduce a valid network type');
}
