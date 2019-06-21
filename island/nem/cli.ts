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
import yargs from 'yargs';
import * as services from './anchor/anchor_grpc_pb';
import { Island, IIslandArgs } from './island';

const parseArguments = (): IIslandArgs => {
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
    islandArgs: {
      endpoint: args.endpointHost + ':' + args.endpointPort,
      privateKey: args.privateKey,
      networkType: args.networkType,
    },
    port: args.port,
  };
}

const startServer = (port: string) => {
  const server = new grpc.Server();
  server.addService(services.AnnounceService, {location: island.location.bind(island)});
  const port = server.bind(`0.0.0.0${port}`, grpc.ServerCredentials.createInsecure());
  if (port === 0) {
    console.error(`Failed to bind to ${port}`);
    process.exit(1);
  }
  server.start();
  console.log(`Island listening on ${port}`);
}

function main() {
  const { islandArgs, port } = parseArguments()
  const island = new Island(islandArgs)
  startServer(port);
}

main();
