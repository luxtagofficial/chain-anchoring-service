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

import fetch from 'node-fetch'
import { BlockchainHttp, BlockInfo } from 'nem2-sdk';
import { Observable } from 'rxjs';
import * as messages from './_proto/anchor_pb';

export interface ISkipperOptions {
  endpoint: string;
}

export class Skipper {
  public readonly opts: ISkipperOptions;
  private blockchainHttp: BlockchainHttp;

  public constructor(opts: ISkipperOptions) {
    this.opts = opts;
    this.blockchainHttp = new BlockchainHttp(this.opts.endpoint);
  }

  public block(call, callback) {
    const reply = new messages.Lock();
    console.log(`Verification request for block height ${call.request.getHeight()}`);

    const header = call.request;
    const blockInfo = this.getBlockInfo(header.toObject());
    blockInfo.subscribe((b) => {
      const block = new messages.Block();
      block.setHeight(b.height.compact().toString());
      block.setHash(b.hash);
      block.setTimestamp(b.timestamp.compact().toString());
      reply.setBlock(block);
      callback(null, reply);
    });
  }

  public getBlockInfo(headerObject: messages.Header.AsObject): Observable<BlockInfo> {
    const {height, type} = headerObject;
    if (type !== messages.IslandType.NEM2) {
      throw Error('Type mismatch');
    }
    return this.blockchainHttp.getBlockByHeight(height);
  }

  public async chainInfo() {
    const [ jsonBlock1, jsonDiagnostic ] = await Promise.all([
      fetch(endpoint + '/block/1').then(resp => resp.json()),
      fetch(endpoint + '/diagnostic/storage').then(resp => resp.json()),
    ])

    if (!jsonBlock1.meta) {
      return this.handleUpstreamMissingKey('meta', jsonBlock1)
    }

    if (!jsonDiagnostic.numBlocks) {
      return this.handleUpstreamMissingKey('numBlocks', jsonBlock1)
    }

    return {
      genesisHash: jsonBlock1.meta.hash,
      currentBlockHeight: jsonDiagnostic.numBlocks,
    }
  }

  private handleUpstreamMissingKey(key: string, jsonResponse: object) {
    return {
      error: `upstream returns unexpected response: '.${key}' key is missing.`,
      details: [
        { jsonResponse },
      ]
    }
  }
}
