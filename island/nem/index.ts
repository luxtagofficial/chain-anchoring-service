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
import * as services from './anchor/anchor_grpc_pb';
import * as messages from './anchor/anchor_pb';

const nem = nemSDK.default;

interface IOptions {
  port: string;
  endpoint: {
    host: string,
    port: string,
  };
  privateKey: string;
  networkType: string;
}

class Island {
  private opts: IOptions;

  public constructor() {
    this.opts = this.parseArguments();
  }

  public startServer() {
    const server = new grpc.Server();
    server.addService(services.AnnounceService, {location: this.location.bind(this)});
    const port = server.bind(`0.0.0.0${this.opts.port}`, grpc.ServerCredentials.createInsecure());
    if (port === 0) {
      console.error(`Failed to bind to ${this.opts.port}`);
      process.exit(1);
    }
    server.start();
    console.log(`Island listening on ${port}`);
  }

  private location(call, callback) {
    const reply = new messages.CallSign();
    const anchor = this.generateAnchor(call.request);
    this.announceAnchor(anchor).then((response) => {
      reply.setId(response.transactionHash.data);
      callback(null, reply);
    });
  }

  private generateAnchor(lock: messages.Lock): messages.Anchor {
    const anchor = new messages.Anchor();
    anchor.setDescription('LuxTag Chain Anchoring Service');
    anchor.setVersion('1.0.1');
    anchor.setTarget(messages.IslandType.NEM);
    anchor.addLocks(lock, 0);
    return anchor;
  }

  private announceAnchor(anchor: messages.Anchor) {
    const keyPair = nem.crypto.keyPair.create(this.opts.privateKey);
    const networkId = nem.model.network.data[this.opts.networkType].id;
    const address = nem.model.address.toAddress(keyPair.publicKey.toString(), networkId);
    const common = nem.model.objects.create('common')('', this.opts.privateKey);
    const endpoint = nem.model.objects.create('endpoint')(this.opts.endpoint.host, this.opts.endpoint.port);
    const serialized = anchor.serializeBinary();
    const hex = nem.utils.convert.ua2hex(serialized);
    // Hack to convert to utf8 as nem-sdk converts message from utf8 to hex by default
    const utf8 = nem.utils.convert.hex2a(hex);
    const transferTransaction = nem.model.objects.create('transferTransaction')(
      address,
      0,
      utf8,
    );
    const transactionEntity = nem.model.transactions.prepare('transferTransaction')(
      common,
      transferTransaction,
      networkId,
    );
    // Shift deadline 5 minutes later to fix timestamp too far in future bug
    // tslint:disable-next-line:no-string-literal
    transactionEntity['timeStamp'] = transactionEntity['timeStamp'] - 300;
    // tslint:disable-next-line:no-string-literal
    transactionEntity['deadline'] = transactionEntity['deadline'] - 300;
    return nem.model.transactions.send(common, transactionEntity, endpoint);
  }

  private parseArguments(): IOptions {
    const args = yargs
      .help('help').alias('help', 'h')
      .env('ISLAND_NEM')
      .option('port', {
        alias: 'l',
        description: 'Port to listen for incoming ships',
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
      .option('networkType', {
        alias: 'n',
        description: 'NEM node endpoint type. Choose from `mainnet`, `testnet`, or `mijin`',
        type: 'string',
      })
      .option('privateKey', {
        alias: 'pk',
        description: 'Private key of account to send the transaction from',
        type: 'string',
      })
      .argv;
    return {
      endpoint: {
        host: args.endpointHost,
        port: args.endpointPort,
      },
      networkType: args.networkType,
      port: args.port,
      privateKey: args.privateKey,
    };
  }
}

function main() {
  const island = new Island();
  island.startServer();
}

main();
