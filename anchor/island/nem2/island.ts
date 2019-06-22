import fetch from 'node-fetch';
import { parse } from 'url';
import * as messages from '../../_proto/anchor_pb';
import { 
  Account,
  Deadline,
  AccountHttp,
  NetworkType,
  TransactionHttp,
  PlainMessage,
  TransferTransaction,
} from 'nem2-sdk';

import { convert } from 'nem2-library';

const ANCHOR_DESCRIPTION = 'LuxTag Chain Anchoring Service'
const ANCHOR_VERSION = '1.0.1'
const ANCHOR_TARGET = messages.IslandType.NEM2

export interface IIslandArgs {
  endpoint: string;
  networkType: string;
  privateKey: string;
}

export class Island {
  private args: IIslandArgs;
  private hostname: string;
  private port: string;

  public constructor(args: IIslandArgs) {
    this.args = args;

    const { protocol, hostname, port } = parse(this.args.endpoint)
    this.hostname = protocol + '//' + hostname
    this.port = port
  }

  public location(call, callback) {
    const reply = new messages.CallSign();
    const anchor = this.generateAnchor(call.request);
    this.announceAnchor(anchor).then((response) => {
      console.log(response);
      reply.setId(response.hash);
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

  public async announceAnchor(anchor: messages.Anchor): Promise<any> {
    const sender = Account.createFromPrivateKey(this.args.privateKey, NetworkType[this.args.networkType]);
    const transactionHttp = new TransactionHttp(this.args.endpoint);

    // BLAME(wzulfikar): monkey patch to bypass underlying hex conversion
    const utf8ToHexUnpatched = convert.utf8ToHex
    convert.utf8ToHex = str => str

    const serialized = anchor.serializeBinary();
    const msg = Buffer.from(serialized).toString('hex')
    const recipientAddress = sender.address
    const transferTransaction = TransferTransaction.create(
        Deadline.create(),
        recipientAddress,
        [],
        PlainMessage.create(msg),
        NetworkType.MIJIN_TEST);
    const signedTx = sender.sign(transferTransaction)

    // put back patched function
    convert.utf8ToHex = utf8ToHexUnpatched

    return transactionHttp.announce(signedTx)
      .toPromise()
      .then(() => ({
        hash: signedTx.hash
      }))
  }

  public currentBlockHeight(): Promise<string> {
    return fetch(this.args.endpoint + '/diagnostic/storage')
      .then(resp => resp.json())
      .then(json => json.numBlocks.toString())
  }
}