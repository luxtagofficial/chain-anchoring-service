import { send } from 'micro'

import anchors from '../anchors.json'

export default async (req, res) => {
	if (req.method === 'OPTIONS') {
	  return send(res, 200, '');
	}

	const [ anchorID ] = req.url.split('/').splice(1)
	if (!anchors[anchorID]) {
		return send(res, 400, {
			error: `anchor '${anchorID}' is invalid`,
			code: 'E_INVALID_ANCHOR',
		})
	}

	const { ship, island: islandConfig } = anchors[anchorID]
	const privateKeyEnv = `PRIVATE_KEY__${anchorID.toUpperCase().replace('::', '_')}`
	islandConfig.privateKey = process.env[privateKeyEnv]

	console.log(`ship: [${ship.type}] ${ship.endpoint}`)
	console.log(`island: [${islandConfig.type}] ${islandConfig.endpoint}`)

	let shipHandler
	try {
		shipHandler = require(`../ship/${ship.type.toLowerCase()}/ship.ts`)
	} catch (e) {
		return send(res, 400, {
			error: `ship type '${ship.type}' is invalid.`
		})
	}
	const lock = await shipHandler.getLock(ship.endpoint)

	let islandMod
	try {
		islandMod = require(`../island/${islandConfig.type.toLowerCase()}/island`)
	} catch (e) {
		console.log("error:", e)
		return send(res, 400, {
			error: `island type '${islandConfig.type}' is invalid.`
		})
	}

	const { endpoint, privateKey, networkType } = islandConfig

	const { Island } = islandMod
	const island = new Island({
		endpoint,
		networkType,
		privateKey,
	})

	const islandHeight = await island.currentBlockHeight()
	const anchor = await island.generateAnchor(lock)
	const announced = await island.announceAnchor(anchor)

	send(res, 200, { 
		lock: lock.toObject(),
		island: {
			type: islandConfig.type,
			endpoint: islandConfig.endpoint,
			networkType: islandConfig.networkType,
			height: islandHeight,
		},
		anchor: {
			hash: announced.hash
		}
	})
}
