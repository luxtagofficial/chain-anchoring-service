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
import grpc from 'grpc';
import * as services from './_proto/anchor_grpc_pb';
import { Skipper, ISkipperOptions } from './skipper'

function parseArguments(): ISkipperOptions {
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

function startServer(skipper: Skipper) {
  const server = new grpc.Server();
  server.addService(services.InspectService, {block: skipper.block.bind(skipper)});
  const port = server.bind(`0.0.0.0${skipper.opts.port}`, grpc.ServerCredentials.createInsecure());
  if (port === 0) {
    console.error(`Failed to bind to ${skipper.opts.port}`);
    process.exit(1);
  }
  server.start();
  console.log(`Island listening on ${port}`);
}

function main() {
  const opts = parseArguments();
  const skipper = new Skipper(opts);
  startServer(skipper);
}

main();
