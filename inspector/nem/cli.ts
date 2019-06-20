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
import { Inspector, InspectorArgs } from './inspector'

const nem = nemSDK.default;

function parseArguments() {
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
    island: args.endpointHost + ':' + args.endpointPort,
    skipper: args.skipper,
  };
}

function main() {
  const inspector = new Inspector(parseArguments() as InspectorArgs);
  inspector.fetchAnchors();
}

main();
