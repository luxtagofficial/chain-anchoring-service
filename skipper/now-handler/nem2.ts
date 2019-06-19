import { send } from 'micro'
import { parse } from 'url'

import { Skipper } from '../nem2/skipper'
import * as messages from '../nem2/_proto/anchor_pb'

import { Ship } from './api'

export const chainInfo = (endpoint: string) => async (res) => {
	const resp = await Skipper.chainInfo(endpoint)
	return send(res, 200, resp)
}

export const handle = (ship: Ship, height: number) => async (req, res) => {
	const skipper = new Skipper(ship.endpoint);

	const blockInfo = await skipper.getBlockInfo({
		height,
		type: messages.IslandType[ship.type.toUpperCase()],
	}).toPromise()

	const block = new messages.Block()
	block.setHeight(blockInfo.height.compact().toString())
	block.setHash(blockInfo.hash)
	block.setTimestamp(blockInfo.timestamp.compact().toString())

	return send(res, 200, block.toObject());
};
