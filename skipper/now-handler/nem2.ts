import { parse } from 'url'

import { Skipper, ISkipperOptions } from '../nem2/skipper'
import * as messages from '../nem2/_proto/anchor_pb'

export default async function (req, res) {
	const { pathname, query = {} } = parse(req.url, true)
	const [ handlerName, height ] = pathname.split('/').splice(1)

	const { endpoint } = query
	const { protocol, hostname, port } = parse(endpoint as string)

	const skipper = new Skipper({
		endpoint: protocol + '//' + hostname,
		port,
	});

	const blockInfo = await skipper.getBlockInfo({
		height: Number.parseInt(height),
		type: messages.IslandType[handlerName.toUpperCase()],
	}).toPromise()

	const block = new messages.Block()
	block.setHeight(blockInfo.height.compact().toString())
	block.setHash(blockInfo.hash)
	block.setTimestamp(blockInfo.timestamp.compact().toString())

	res.end(JSON.stringify(block.toObject()));
};
