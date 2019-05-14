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
import grpc from 'grpc';
import { AccountHttp, NetworkType, PublicAccount, QueryParams, TransferTransaction } from 'nem2-sdk';
import { EMPTY } from 'rxjs';
import { concatMap, count, expand, filter, map } from 'rxjs/operators';
import yargs from 'yargs';
import services from './anchor/anchor_grpc_pb';
import messages from './anchor/anchor_pb';

interface IOptions {
  publicAccount: PublicAccount;
  endpoint: string;
  skipper: string;
}

class Inspector {
  private opts: IOptions;
  private accountHttp: AccountHttp;
  private skipper: services.InspectClient;

  public constructor() {
    this.opts = this.parseArguments();
    this.accountHttp = new AccountHttp(this.opts.endpoint);
    this.skipper = new services.InspectClient(this.opts.skipper, grpc.credentials.createInsecure());
  }

  public fetchAnchors() {
    const pageSize: number = 100;
    let queryParams = new QueryParams(pageSize);
    this.accountHttp.transactions(this.opts.publicAccount, queryParams).pipe(
      expand( (transactions) => {
        queryParams = new QueryParams(pageSize, transactions[transactions.length - 1].transactionInfo!.id);
        return transactions.length >= pageSize
          ? this.accountHttp.transactions(this.opts.publicAccount, queryParams)
          : EMPTY;
      }),
      concatMap(
        (txs) => {
          // console.log(txs);
          return txs.map((tx) => {
            let lockList: messages.Lock[] = [];
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
            return lockList;
          });
        },
      ),
      filter((lockList) => lockList.length > 0),
      concatMap(
        (lockList) => {
          return lockList.filter((lock) => lock.getBlock()!.getHeight() !== 0);
        },
      ),
      map(
        async (lock) => {
          const reply = await this.verifyLock(lock);
          return reply;
        },
      ),
      count(),
    ).subscribe(
      (sum) => {
        console.log(`Found ${sum} anchors`);
      },
    );
  }

  private verifyLock(lock: messages.Lock): Promise<boolean> {
    const block = lock.getBlock();
    const header = new messages.Header();
    header.setHeight(block!.getHeight());
    header.setType(lock.getType());
    return new Promise((resolve, reject) => {
      this.skipper.block(header, (err, resp) => {
        if (err) {
          reject(err);
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

  private parseArguments(): IOptions {
    const args = yargs
      .help('help').alias('help', 'h')
      .env('INSPECTOR_NEM2')
      .option('skipper', {
        alias: 'l',
        description: 'Skipper gRPC url',
        type: 'string',
      })
      .option('endpoint', {
        alias: 'e',
        description: 'Catapult endpoint',
        type: 'string',
      })
      .option('publicKey', {
        alias: 'pk',
        description: 'Public key of account to fetch transactions from',
        type: 'string',
      })
      .option('networkType', {
        alias: 'n',
        description: 'NEM node endpoint type. Choose from `MIJIN_TEST`',
        type: 'string',
      })
      .argv;
    // Test address
    let publicAccount: PublicAccount;
    try {
      const networkType = getNetwork(args.networkType);
      publicAccount = PublicAccount.createFromPublicKey(args.publicKey, networkType);
    } catch (e) {
      console.log(e);
      throw Error('NEM address is not valid');
    }
    return {
      endpoint: args.endpoint,
      publicAccount,
      skipper: args.skipper,
    };
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

function main() {
  const inspector = new Inspector();
  inspector.fetchAnchors();
}

main();
