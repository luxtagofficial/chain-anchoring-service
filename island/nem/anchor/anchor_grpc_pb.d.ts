// package: anchor
// file: anchor.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as anchor_pb from "./anchor_pb";

interface IAnnounceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    location: IAnnounceService_ILocation;
}

interface IAnnounceService_ILocation extends grpc.MethodDefinition<anchor_pb.Lock, anchor_pb.CallSign> {
    path: string; // "/anchor.Announce/Location"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<anchor_pb.Lock>;
    requestDeserialize: grpc.deserialize<anchor_pb.Lock>;
    responseSerialize: grpc.serialize<anchor_pb.CallSign>;
    responseDeserialize: grpc.deserialize<anchor_pb.CallSign>;
}

export const AnnounceService: IAnnounceService;

export interface IAnnounceServer {
    location: grpc.handleUnaryCall<anchor_pb.Lock, anchor_pb.CallSign>;
}

export interface IAnnounceClient {
    location(request: anchor_pb.Lock, callback: (error: grpc.ServiceError | null, response: anchor_pb.CallSign) => void): grpc.ClientUnaryCall;
    location(request: anchor_pb.Lock, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: anchor_pb.CallSign) => void): grpc.ClientUnaryCall;
    location(request: anchor_pb.Lock, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: anchor_pb.CallSign) => void): grpc.ClientUnaryCall;
}

export class AnnounceClient extends grpc.Client implements IAnnounceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public location(request: anchor_pb.Lock, callback: (error: grpc.ServiceError | null, response: anchor_pb.CallSign) => void): grpc.ClientUnaryCall;
    public location(request: anchor_pb.Lock, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: anchor_pb.CallSign) => void): grpc.ClientUnaryCall;
    public location(request: anchor_pb.Lock, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: anchor_pb.CallSign) => void): grpc.ClientUnaryCall;
}
