// package: anchor
// file: anchor.proto

/* tslint:disable */

import * as jspb from "google-protobuf";

export class Anchor extends jspb.Message { 
    getDescription(): string;
    setDescription(value: string): void;

    getVersion(): string;
    setVersion(value: string): void;

    getTarget(): IslandType;
    setTarget(value: IslandType): void;

    clearLocksList(): void;
    getLocksList(): Array<Lock>;
    setLocksList(value: Array<Lock>): void;
    addLocks(value?: Lock, index?: number): Lock;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Anchor.AsObject;
    static toObject(includeInstance: boolean, msg: Anchor): Anchor.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Anchor, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Anchor;
    static deserializeBinaryFromReader(message: Anchor, reader: jspb.BinaryReader): Anchor;
}

export namespace Anchor {
    export type AsObject = {
        description: string,
        version: string,
        target: IslandType,
        locksList: Array<Lock.AsObject>,
    }
}

export class Lock extends jspb.Message { 
    getType(): IslandType;
    setType(value: IslandType): void;

    getVersion(): string;
    setVersion(value: string): void;

    getName(): string;
    setName(value: string): void;


    hasBlock(): boolean;
    clearBlock(): void;
    getBlock(): Block | undefined;
    setBlock(value?: Block): void;

    getLastknownposition(): string;
    setLastknownposition(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Lock.AsObject;
    static toObject(includeInstance: boolean, msg: Lock): Lock.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Lock, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Lock;
    static deserializeBinaryFromReader(message: Lock, reader: jspb.BinaryReader): Lock;
}

export namespace Lock {
    export type AsObject = {
        type: IslandType,
        version: string,
        name: string,
        block?: Block.AsObject,
        lastknownposition: string,
    }
}

export class Block extends jspb.Message { 
    getObsoleteHeight(): string;
    setObsoleteHeight(value: string): void;

    getHash(): string;
    setHash(value: string): void;

    getTimestamp(): string;
    setTimestamp(value: string): void;

    clearUriList(): void;
    getUriList(): Array<string>;
    setUriList(value: Array<string>): void;
    addUri(value: string, index?: number): string;

    getHeight(): number;
    setHeight(value: number): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Block.AsObject;
    static toObject(includeInstance: boolean, msg: Block): Block.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Block, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Block;
    static deserializeBinaryFromReader(message: Block, reader: jspb.BinaryReader): Block;
}

export namespace Block {
    export type AsObject = {
        obsoleteHeight: string,
        hash: string,
        timestamp: string,
        uriList: Array<string>,
        height: number,
    }
}

export class CallSign extends jspb.Message { 
    getId(): string;
    setId(value: string): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CallSign.AsObject;
    static toObject(includeInstance: boolean, msg: CallSign): CallSign.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CallSign, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CallSign;
    static deserializeBinaryFromReader(message: CallSign, reader: jspb.BinaryReader): CallSign;
}

export namespace CallSign {
    export type AsObject = {
        id: string,
    }
}

export class Header extends jspb.Message { 
    getHeight(): number;
    setHeight(value: number): void;

    getType(): IslandType;
    setType(value: IslandType): void;


    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Header.AsObject;
    static toObject(includeInstance: boolean, msg: Header): Header.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Header, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Header;
    static deserializeBinaryFromReader(message: Header, reader: jspb.BinaryReader): Header;
}

export namespace Header {
    export type AsObject = {
        height: number,
        type: IslandType,
    }
}

export enum IslandType {
    BTC = 0,
    ETH = 1,
    NEM = 2,
    NEM2 = 3,
}
