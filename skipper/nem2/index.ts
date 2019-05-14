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
import { BlockchainHttp, BlockInfo } from 'nem2-sdk';
import { Observable } from 'rxjs';
import yargs from 'yargs';
import * as services from './anchor/anchor_grpc_pb';
import * as messages from './anchor/anchor_pb';

interface IOptions {
  port: string;
  endpoint: string;
}

class Skipper {
  private opts: IOptions;
  private blockchainHttp: BlockchainHttp;

  public constructor() {
    this.opts = this.parseArguments();
    this.blockchainHttp = new BlockchainHttp(this.opts.endpoint);
  }

  public startServer() {
    const server = new grpc.Server();
    server.addService(services.InspectService, {block: this.block.bind(this)});
    const port = server.bind(`0.0.0.0${this.opts.port}`, grpc.ServerCredentials.createInsecure());
    if (port === 0) {
      console.error(`Failed to bind to ${this.opts.port}`);
      process.exit(1);
    }
    server.start();
    console.log(`Island listening on ${port}`);
  }

  private block(call, callback) {
    const reply = new messages.Lock();
    console.log(`Received verification request for block height ${call.request.getHeight()}`);
    const blockInfo = this.getBlockInfo(call.request);
    blockInfo.subscribe((b) => {
      const block = new messages.Block();
      block.setHeight(b.height.compact());
      block.setHash(b.hash);
      block.setTimestamp(b.timestamp.compact().toString());
      reply.setBlock(block);
      callback(null, reply);
    });
  }

  private getBlockInfo(header: messages.Header): Observable<BlockInfo> {
    const {height, type} = header.toObject();
    if (type !== messages.IslandType.NEM2) {
      throw Error('Type mismatch');
    }
    return this.blockchainHttp.getBlockByHeight(height);
  }

  private parseArguments(): IOptions {
    const args = yargs
      .help('help').alias('help', 'h')
      .env('SKIPPER_NEM2')
      .option('port', {
        alias: 'p',
        description: 'gRPC server port',
        type: 'string',
      })
      .option('endpoint', {
        alias: 'e',
        description: 'Catapult endpoint',
        type: 'string',
      })
      .argv;
    return {
      endpoint: args.endpoint,
      port: args.port,
    };
  }
}

function main() {
  const skipper = new Skipper();
  skipper.startServer();
}

main();
