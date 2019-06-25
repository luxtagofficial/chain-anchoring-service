/**
 * @fileoverview gRPC-Web generated client stub for anchor
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!



const grpc = {};
grpc.web = require('grpc-web');

const proto = {};
proto.anchor = require('./anchor_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.anchor.AnnounceClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

  /**
   * @private @const {?Object} The credentials to be used to connect
   *    to the server
   */
  this.credentials_ = credentials;

  /**
   * @private @const {?Object} Options for the client
   */
  this.options_ = options;
};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.anchor.AnnouncePromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

  /**
   * @private @const {?Object} The credentials to be used to connect
   *    to the server
   */
  this.credentials_ = credentials;

  /**
   * @private @const {?Object} Options for the client
   */
  this.options_ = options;
};


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anchor.Lock,
 *   !proto.anchor.CallSign>}
 */
const methodInfo_Announce_Location = new grpc.web.AbstractClientBase.MethodInfo(
  proto.anchor.CallSign,
  /** @param {!proto.anchor.Lock} request */
  function(request) {
    return request.serializeBinary();
  },
  proto.anchor.CallSign.deserializeBinary
);


/**
 * @param {!proto.anchor.Lock} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anchor.CallSign)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anchor.CallSign>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anchor.AnnounceClient.prototype.location =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anchor.Announce/Location',
      request,
      metadata || {},
      methodInfo_Announce_Location,
      callback);
};


/**
 * @param {!proto.anchor.Lock} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anchor.CallSign>}
 *     A native promise that resolves to the response
 */
proto.anchor.AnnouncePromiseClient.prototype.location =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anchor.Announce/Location',
      request,
      metadata || {},
      methodInfo_Announce_Location);
};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.anchor.InspectClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

  /**
   * @private @const {?Object} The credentials to be used to connect
   *    to the server
   */
  this.credentials_ = credentials;

  /**
   * @private @const {?Object} Options for the client
   */
  this.options_ = options;
};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.anchor.InspectPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

  /**
   * @private @const {?Object} The credentials to be used to connect
   *    to the server
   */
  this.credentials_ = credentials;

  /**
   * @private @const {?Object} Options for the client
   */
  this.options_ = options;
};


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anchor.Header,
 *   !proto.anchor.Lock>}
 */
const methodInfo_Inspect_Block = new grpc.web.AbstractClientBase.MethodInfo(
  proto.anchor.Lock,
  /** @param {!proto.anchor.Header} request */
  function(request) {
    return request.serializeBinary();
  },
  proto.anchor.Lock.deserializeBinary
);


/**
 * @param {!proto.anchor.Header} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anchor.Lock)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anchor.Lock>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anchor.InspectClient.prototype.block =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anchor.Inspect/Block',
      request,
      metadata || {},
      methodInfo_Inspect_Block,
      callback);
};


/**
 * @param {!proto.anchor.Header} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anchor.Lock>}
 *     A native promise that resolves to the response
 */
proto.anchor.InspectPromiseClient.prototype.block =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anchor.Inspect/Block',
      request,
      metadata || {},
      methodInfo_Inspect_Block);
};


module.exports = proto.anchor;

