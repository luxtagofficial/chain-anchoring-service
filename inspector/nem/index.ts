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
import * as nemSDK from 'nem-sdk';
import yargs from 'yargs';
import services from './anchor/anchor_grpc_pb';
import messages from './anchor/anchor_pb';

const nem = nemSDK.default;

interface IOptions {
  address: string;
  endpoint: {
    host: string,
    port: string,
  };
  skipper: string;
}

class Inspector {

public IOptions;   private opts: IOptions;
  private endpoint: any;
  private skipper: services.InspectClient;

  public constructor() {
    this.opts = this.parseArguments();
    this.endpoint = nem.model.objects.create('endpoint')(this.opts.endpoint.host, this.opts.endpoint.port);
    this.skipper = new services.InspectClient(this.opts.skipper, grpc.credentials.createInsecure());
  }

  public fetchAnchors() {
    let lockList: messages.Lock[] = [];
    nem.com.requests.account.transactions.all(this.endpoint, this.opts.address).then(
      (txs) => {
        if (txs.data) {
          txs.data.forEach((tx) => {
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
          });
        }
      },
      (err) => console.error(err),
    ).finally(
      async () => {
        const locks = lockList.filter((lock) => lock.getBlock()!.getHeight() !== '');
        console.log(`Found ${locks.length} anchors`);
        for (const lock of locks) {
          console.log(`Verifying block at height ${lock.getBlock()!.getHeight()}`);
          await this.verifyLock(lock);
        }
      },
    );
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

  private parseArguments() {
    const args = yargs
    .help('help').alias('help', 'h')
    .env('INSPECTOR_NEM')
    .option('skipper', {
      alias: 'l',
      description: 'Skipper gRPC url',
      type: 'string',
    })
    .option('endpointHost', {
      alias: 'e',
      description: 'NEM node endpoint. Include protocol if necessary',
      type: 'string',
    })
    .option('endpointPort', {
      alias: 'p',
      description: 'NEM node endpoint port',
      type: 'string',
    })
    .option('address', {
      alias: 'a',
      description: 'Address of account to fetch transactions from',
      type: 'string',
    })
    .argv;
    // Test address
    if (!nem.model.address.isValid(args.address)) {
      throw Error('NEM address is not valid');
    }
    return {
      address: args.address,
      endpoint: {
        host: args.endpointHost,
        port: args.endpointPort,
      },
      skipper: args.skipper,
    };
  }
}

function hextoUint8Arr(hexx: string): Uint8Array {
  const hex = hexx.toString(); // force conversion
  const ua = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    ua[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return ua;
}

function main() {
  const inspector = new Inspector();
  inspector.fetchAnchors();
}

main();
