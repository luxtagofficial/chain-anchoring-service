import * as messages from '../_proto/anchor_pb';

export const PAGE_SIZE: number = 10;

export type ErrorObject = {
	error: string
	code: string
}

export type InspectorContract = {
	island: string;
	skipper: string;
}

export type InspectorLock = {
	offsetID: string;
	txHash: string;
	lockList: messages.Lock[];
}

export type InspectedAnchor = {
	height: string;
	hash: string;
	valid: boolean;
	island: {
		offsetID: string;
		txHash: string;
	}
}