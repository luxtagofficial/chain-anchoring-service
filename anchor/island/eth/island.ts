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

import Web3 from 'web3';
import { TransactionReceipt } from 'web3-core';
import * as messages from '../../_proto/anchor_pb';

const ANCHOR_DESCRIPTION = 'LuxTag Chain Anchoring Service';
const ANCHOR_VERSION = '1.0.1';
const ANCHOR_TARGET = messages.IslandType.ETH;

export interface IIslandArgs {
  endpoint: string;
  privateKey: string;
}

export class Island {
  private args: IIslandArgs;

  public constructor(args: IIslandArgs) {
    this.args = args;
  }

  public location(call, callback) {
    const reply = new messages.CallSign();
    const anchor = this.generateAnchor(call.request);
    this.announceAnchor(anchor).then((response) => {
      reply.setId(response.transactionHash);
      callback(null, reply);
    });
  }

  public generateAnchor(lock: messages.Lock): messages.Anchor {
    const anchor = new messages.Anchor();
    anchor.setDescription(ANCHOR_DESCRIPTION);
    anchor.setVersion(ANCHOR_VERSION);
    anchor.setTarget(ANCHOR_TARGET);
    anchor.addLocks(lock);
    return anchor;
  }

 public async announceAnchor(anchor: messages.Anchor): Promise<TransactionReceipt> {
    const web3 = new Web3(new Web3.providers.HttpProvider(this.args.endpoint));
    const account = web3.eth.accounts.privateKeyToAccount('0x' + this.args.privateKey);
    const tx = {
      data: '0x' + Buffer.from(anchor.serializeBinary()).toString('hex'),
      gas: 0,
      nonce: 0,
      to: account.address,
    };
    tx.gas = await web3.eth.estimateGas(tx);
    tx.nonce = await web3.eth.getTransactionCount(account.address, 'pending');

    const { rawTransaction } = await account.signTransaction(tx);
    if (rawTransaction) {
      return web3.eth.sendSignedTransaction(rawTransaction);
    } else {
      throw Error('Unable to send transaction');
    }
  }
}
