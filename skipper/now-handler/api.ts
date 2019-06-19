import { parse } from 'url'
import { send } from 'micro'

import { Joi, validate } from './utils/validator'
import ships from './ships.json'

export type Ship = {
	endpoint: string;
	type: string;
}

const schema = Joi.object().keys({
	shipID: Joi.string().required(),

	// unsigned integer without leading zero
	height: Joi.string().regex(/^[1-9][0-9]{0,}$/).required(),
})

const getHandler = (shipID: string) => {
	const ship = ships[shipID]
	if (!ship) {
		return {
			error: `ship ID '${shipID}' is invalid.`,
			code: `E_INVALID_SHIP_ID`
		}
	}

	const handlerName = ship.type.toLowerCase()
	const handler = require(`./${handlerName}`)
	if (!handler || typeof handler.handle != 'function') {
		return {
			error: `missing handler for chain type ${ship.type}.`,
			code: 'INTERNAL_ERROR',
		}
	}

	return { handler, ship }
}

const handleChainInfo = (shipID) => async (req, res) => {
	const { error: handlerErr, handler, ship } = getHandler(shipID)
	if (handlerErr) {
		return send(res, 400, handlerErr)
	}

	try {
		return await handler.chainInfo(ship.endpoint)(res)
	} catch (e) {
		const error = `failed to fetch chain info: ${e.message}`
		console.log(`[ERROR] ${error}\n`, e)
		return send(res, 400, {
			error,
		})
	}
}

export default async (req, res) => {
	const { pathname, query = {} } = parse(req.url, true)
	const [ shipID, height ] = pathname.split('/').splice(1)

	if (pathname.endsWith('/chain/info')) {
		return handleChainInfo(shipID)(req, res)
	}

	const payloadError = validate(schema, { shipID, height })
	if (payloadError) {
		return send(res, 400, {
			...payloadError,
			error: "request does not satisfy path params of '/{shipID}/{height}'",
		})
	}

	const { error: handlerErr, handler, ship } = getHandler(shipID)
	if (handlerErr) {
		return send(res, 400, handlerErr)
	}

	try {
		const { protocol, hostname, port } = parse(ship.endpoint as string)
		return await handler.handle(ship, Number.parseInt(height))(req, res)
	} catch (e) {
		const msg = 'failed to fetch blocks from ship endpoint. is the ship endpoint online?'
		console.log(`[ERROR] ${msg}:`, e)
		return send(res, 500, {
			error: msg,
			code: "E_UPSTREAM_ERROR"
		})
	}
}
