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
import Web3 from 'web3';
import { ErrorObject, InspectedAnchor, InspectorContract, InspectorLock, PAGE_SIZE } from '../types';
import { useRestSkipper } from '../useRestSkipper';
import { logger, sortAnchors } from '../utils';
import * as services from '../_proto/anchor_grpc_pb';
import * as messages from '../_proto/anchor_pb';

export type InspectorArgs = InspectorContract & {
  accountAddress: string;
};

const handleUpstreamMissingKey = (key: string, jsonResponse: object) => {
  return {
    error: `upstream returns unexpected response: '.${key}' key is missing.`,
    details: [
      { jsonResponse },
    ],
  };
};

export class Inspector {

  public static async chainInfo(endpoint: string) {
    const web3 = new Web3(new Web3.providers.HttpProvider(endpoint));
    const [ genesisBlock, latestBlock ] = await Promise.all([
      web3.eth.getBlock(0),
      web3.eth.getBlock('latest'),
    ]);

    if (!genesisBlock.hash) {
      return handleUpstreamMissingKey('meta', genesisBlock);
    }

    if (!latestBlock.hash) {
      return handleUpstreamMissingKey('numBlocks', latestBlock);
    }

    return {
      genesisHash: genesisBlock.hash,
      currentBlockHeight: latestBlock.number,
    };
  }

  private args: InspectorArgs;
  private skipper: services.InspectClient | any;
  private web3: Web3;
  private accountAddress: string;
  private useRestSkipper: boolean;

  public constructor(args: InspectorArgs) {
    this.args = args;

    this.useRestSkipper = this.args.skipper.startsWith('http');
    if (this.useRestSkipper) {
      this.skipper = useRestSkipper(this.args.skipper);
    } else {
      this.skipper = new services.InspectClient(this.args.skipper, grpc.credentials.createInsecure());
    }

    this.web3 = new Web3(new Web3.providers.HttpProvider(this.args.island));
    this.accountAddress = this.args.accountAddress;
  }

  public async fetchAnchors(offset?: number): Promise<InspectedAnchor[] | ErrorObject> {
    offset = offset ? offset : 0;
    let anchors: InspectedAnchor[] = [];
    let iter = 0;

    let currentBlockHeight = await this.web3.eth.getBlock('latest').then((block) => block.number);

    while (anchors.length < PAGE_SIZE && iter < 1000) { // Stop searching after 1000 blocks
      await this.web3.eth.getBlock(currentBlockHeight, true).then(async (block) => {
        console.log(block.number);
        if (block.transactions.length > 0) {
          const txs = block.transactions.filter((tx) => tx.from === this.accountAddress);
          const locks: InspectorLock[] = [];
          for (const tx of txs) {
            try {
              console.log(tx.input);
              const anchor = messages.Anchor.deserializeBinary(hex2arr(tx.input));
              // Ignore anchor with no locks
              if (anchor.getLocksList().length !== 0) {
                locks.push({
                  offsetID: block.number.toString(),
                  txHash: tx.hash,
                  lockList: anchor.getLocksList(),
                });
              }
            } catch (e) {
              logger.warn(`'messages.Anchor.deserializeBinary' failed: ${e.message}. tx: ${JSON.stringify(tx)}`);
            }

            const anchorsFound: InspectedAnchor[] = [];
            for (const { offsetID, txHash, lockList } of locks) {
              for (const lock of lockList) {
                if ((anchors.length + anchorsFound.length) >= PAGE_SIZE) {
                  break;
                }

                const lockBlock = lock.getBlock()!;
                const height = lockBlock.getHeight();
                if (height) {
                  const valid = await this.verifyLock(lock);
                  anchorsFound.push({
                    hash: lockBlock.getHash(),
                    height,
                    valid,
                    island: {
                      offsetID,
                      txHash,
                    },
                  });
                } else {
                  logger.warn(`lock with no height won't be considered as anchor: ${JSON.stringify(lock.toObject())}`);
                }
              }
            }
            anchors = [...anchors, ...anchorsFound];
            logger.info(
              `Found ${anchorsFound.length} anchor(s) across ${txs.length} txs in iter #${iter}.
              Total anchors: ${anchors.length}`,
            );
          }
        }

        iter++;
        --currentBlockHeight;
      });
    }

    return sortAnchors(anchors);
  }

  private async verifyLock(lock: messages.Lock): Promise<boolean> {
    const island = lock.getBlock()!.toObject();
    const header = new messages.Header();
    header.setHeight(parseInt(island.height, 10));
    header.setType(lock.getType());

    if (this.useRestSkipper) {
      try {
        const ship = await this.skipper.fetchRest(island.height);
        if (island.height === ship.height) {
          return island.hash === ship.hash;
        }
        logger.warn('HEIGHT NOT SAME', {ship, island});
        return false;
      } catch (e) {
        logger.warn('`verifyLock` failed:', e);
        return false;
      }
    }

    return new Promise((resolve, reject) => {
      this.skipper.block(header, (err, resp) => {
        if (err) {
          reject(err);
        }

        if (!resp) {
          throw new Error('upstream returns undefined response. is the service online?');
        }

        const ship = resp.getBlock()!.toObject();
        if (island.height === ship.height) {
          resolve(island.hash === ship.hash);
        }
      });
    });
  }
}
function hex2arr(hex) {
  hex = hex.replace(/^0x/i, '');
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
