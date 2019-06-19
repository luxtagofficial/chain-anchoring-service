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
import * as services from './_proto/anchor_grpc_pb';
import * as messages from './_proto/anchor_pb';
import { useRestSkipper } from '../useRestSkipper';

export interface IInspectorOptions {
  island: string;
  skipper: string;

  publicKey: string;
  networkType: string;
}

export type InspectedAnchor = {
  height: string;
  hash: string;
  valid: boolean;
}

export class Inspector {
  private opts: IInspectorOptions;
  private skipper: services.InspectClient | any;
  private accountHttp: AccountHttp;
  private publicAccount: PublicAccount;
  private useRestSkipper: boolean;

  public constructor(opts: IInspectorOptions) {
    this.opts = opts;

    this.useRestSkipper = this.opts.skipper.startsWith('http')
    if (this.useRestSkipper) {
      this.skipper = useRestSkipper(this.opts.skipper)
    } else {
      this.skipper = new services.InspectClient(this.opts.skipper, grpc.credentials.createInsecure());
    }

    this.accountHttp = new AccountHttp(this.opts.island);

    try {
      const networkType = getNetwork(this.opts.networkType);
      this.publicAccount = PublicAccount.createFromPublicKey(this.opts.publicKey, networkType);
    } catch (e) {
      console.log(e);
      throw Error('NEM address is not valid');
    }
  }

  public static async genesisHash(endpoint: string) {
    const resp = await fetch(endpoint + '/block/1')

    const json = await resp.json()
    if (!json.meta) {
      return {
        error: 'endpoint returns unexpected response: `.meta` key is missing.',
        details: [
          { jsonResponse: json },
        ]
      }
    }

    return {
      genesisHash: json.meta.hash
    }
  }

  public async fetchAnchors() {
    const pageSize: number = 100;
    let queryParams = new QueryParams(pageSize);

    const lockList = await this.accountHttp.transactions(this.publicAccount, queryParams).pipe(
      expand( (transactions) => {
        queryParams = new QueryParams(pageSize, transactions[transactions.length - 1].transactionInfo!.id);
        return transactions.length >= pageSize
          ? this.accountHttp.transactions(this.publicAccount, queryParams)
          : EMPTY;
      }),
      concatMap(
        async (txs) => {
          let lockList: messages.Lock[] = [];
          await Promise.all(txs.map((tx) => {
            if (tx instanceof TransferTransaction) {
              try {
                const anchor = messages.Anchor.deserializeBinary(str2arr(tx.message.payload));
                // Ignore anchor with no locks
                if (anchor.getLocksList().length !== 0) {
                  lockList = lockList.concat(anchor.getLocksList());
                }
              } catch (e) {
                // console.log(e);
              }
            }
          }));
          return lockList;
        },
      )
    ).toPromise();

    let anchors: InspectedAnchor[] = []
    for (var i = 0; i < lockList.length; i++) {
      const block = lockList[i].getBlock()!
      const height = block.getHeight()
      if (height) {
        const valid = await this.verifyLock(lockList[i])
        anchors.push({
          height,
          hash: block.getHash(),
          valid
        })
      }
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
