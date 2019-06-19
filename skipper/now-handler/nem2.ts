import { send } from 'micro'
import { parse } from 'url'

import { Skipper, ISkipperOptions } from '../nem2/skipper'
import * as messages from '../nem2/_proto/anchor_pb'

import { Ship } from './api'

export const chainInfo = (ship) => async (res) => {
	const { protocol, hostname, port } = parse(ship.endpoint as string)
	const skipper = new Skipper({
		endpoint: protocol + '//' + hostname,
		port,
	});

	const resp = await skipper.chainInfo()
	return send(res, 200, resp)
}

export const handle = (ship: Ship, height: number) => async (req, res) => {
	const { protocol, hostname, port } = parse(ship.endpoint as string)

	const skipper = new Skipper({
		endpoint: protocol + '//' + hostname,
		port,
	});

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
