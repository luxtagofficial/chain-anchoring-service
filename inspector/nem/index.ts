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

import * as nemSDK from 'nem-sdk';
import yargs from 'yargs';
import * as messages from './anchor/anchor_pb';

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
  private opts: IOptions;
  private endpoint: any;

  public constructor() {
    this.opts = this.parseArguments();
    this.endpoint = nem.model.objects.create('endpoint')(this.opts.endpoint.host, this.opts.endpoint.port);
  }

  public fetchAnchors() {
    nem.com.requests.account.transactions.all(this.endpoint, this.opts.address).then(
      (txs) => {
        if (txs.data) {
          txs.data.forEach((tx) => {
            // console.log(tx.transaction);
            const messageObj = tx.transaction.message;
            if (messageObj) {
              try {
                const anchor = messages.Anchor.deserializeBinary(hextoUint8Arr(messageObj.payload));
                // Ignore anchor with no locks
                if (anchor.getLocksList().length !== 0) {
                  console.log(messageObj.payload);
                  console.log(anchor.toObject());
                }
              } catch (e) {
                // Ignore messages that cannot be parsed
              }
            }
          });
        }
      },
      (err) => console.error(err),
    );
  }

  private parseArguments(): IOptions {
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
