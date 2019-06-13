import * as grpcWeb from 'grpc-web';

import {
  CallSign,
  Header,
  Lock} from './anchor_pb';

export class AnnounceClient {
  constructor (hostname: string,
               credentials: null | { [index: string]: string; },
               options: null | { [index: string]: string; });

  location(
    request: Lock,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: CallSign) => void
  ): grpcWeb.ClientReadableStream<CallSign>;

}

export class InspectClient {
  constructor (hostname: string,
               credentials: null | { [index: string]: string; },
               options: null | { [index: string]: string; });

  block(
    request: Header,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: Lock) => void
  ): grpcWeb.ClientReadableStream<Lock>;

}

export class AnnouncePromiseClient {
  constructor (hostname: string,
               credentials: null | { [index: string]: string; },
               options: null | { [index: string]: string; });

  location(
    request: Lock,
    metadata?: grpcWeb.Metadata
  ): Promise<CallSign>;

}

export class InspectPromiseClient {
  constructor (hostname: string,
               credentials: null | { [index: string]: string; },
               options: null | { [index: string]: string; });

  block(
    request: Header,
    metadata?: grpcWeb.Metadata
  ): Promise<Lock>;

}

