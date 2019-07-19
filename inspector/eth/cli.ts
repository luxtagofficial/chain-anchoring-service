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

import yargs from 'yargs';
import { InspectedAnchor } from '../types';
import { Inspector, InspectorArgs } from './inspector';

function parseArguments(): InspectorArgs {
  const args = yargs
    .help('help').alias('help', 'h')
    .env('INSPECTOR_ETH')
    .option('skipper', {
      alias: 'l',
      description: 'Skipper gRPC url',
      type: 'string',
    })
    .option('endpoint', {
      alias: 'e',
      description: 'Ethereum RPC endpoint',
      type: 'string',
    })
    .option('address', {
      alias: 'a',
      description: 'Address of account to fetch transactions from',
      type: 'string',
    })
    .option('useRestSkipper', {
      alias: 'y',
      description: 'Whether to use grpc-based skipper or REST-based.',
      type: 'boolean',
    })
    .argv;

  return {
    island: args.endpoint,
    accountAddress: args.address,

    // if skipper has http or https prefix, rest skipper will be used.
    skipper: args.skipper,
  };
}

async function main() {
  const inspector = new Inspector(parseArguments() as InspectorArgs);
  const anchors = await inspector.fetchAnchors();
  (anchors as InspectedAnchor[]).forEach((anchor) => {
    console.log(`Height ${anchor.height}: ${anchor.valid ? 'Verified' : 'Invalid'}`);
  });
}

main();
