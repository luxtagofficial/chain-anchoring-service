// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
//  Copyright 2019 Luxtag Sdn.Bhd. (Malaysia)
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
'use strict';
var grpc = require('grpc');
var anchor_pb = require('./anchor_pb.js');

function serialize_anchor_CallSign(arg) {
  if (!(arg instanceof anchor_pb.CallSign)) {
    throw new Error('Expected argument of type anchor.CallSign');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_anchor_CallSign(buffer_arg) {
  return anchor_pb.CallSign.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_anchor_Lock(arg) {
  if (!(arg instanceof anchor_pb.Lock)) {
    throw new Error('Expected argument of type anchor.Lock');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_anchor_Lock(buffer_arg) {
  return anchor_pb.Lock.deserializeBinary(new Uint8Array(buffer_arg));
}


var AnnounceService = exports.AnnounceService = {
  location: {
    path: '/anchor.Announce/Location',
    requestStream: false,
    responseStream: false,
    requestType: anchor_pb.Lock,
    responseType: anchor_pb.CallSign,
    requestSerialize: serialize_anchor_Lock,
    requestDeserialize: deserialize_anchor_Lock,
    responseSerialize: serialize_anchor_CallSign,
    responseDeserialize: deserialize_anchor_CallSign,
  },
};

exports.AnnounceClient = grpc.makeGenericClientConstructor(AnnounceService);
