import fetch from 'node-fetch';
import { parse } from 'url';
import * as nemSDK from 'nem-sdk';
import * as services from '../_proto/anchor_grpc_pb';
import * as messages from '../_proto/anchor_pb';

const nem = nemSDK.default;

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
      reply.setId(response.hash);
      callback(null, reply);
    });
  }

  public generateAnchor(lock: messages.Lock): messages.Anchor {
    const anchor = new messages.Anchor();
    anchor.setDescription('LuxTag Chain Anchoring Service');
    anchor.setVersion('1.0.2');
    anchor.setTarget(messages.IslandType.NEM);
    anchor.addLocks(lock);
    return anchor;
  }

  public announceAnchor(anchor: messages.Anchor): Promise<any> {
    const keyPair = nem.crypto.keyPair.create(this.args.privateKey);
    const networkId = nem.model.network.data[this.args.networkType].id;
    const address = nem.model.address.toAddress(keyPair.publicKey.toString(), networkId);
    const common = nem.model.objects.create('common')('', this.args.privateKey);
    const endpoint = nem.model.objects.create('endpoint')(this.hostname, this.port);
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
    return nem
      .model
      .transactions
      .send(common, transactionEntity, endpoint)
      .then(resp => ({
        hash: resp.transactionHash.data
      }))
  }

  public currentBlockHeight(): Promise<string> {
    return fetch(this.args.endpoint + '/chain/height')
      .then(resp => resp.json())
      .then(json => json.height.toString())
  }
}