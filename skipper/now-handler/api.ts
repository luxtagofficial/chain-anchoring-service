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

export default async function (req, res) {
	const { pathname, query = {} } = parse(req.url, true)
	const [ shipID, height ] = pathname.split('/').splice(1)

	const payloadError = validate(schema, { shipID, height})
	if (payloadError) {
		return send(res, 400, {
			...payloadError,
			error: "request does not satisfy path params of '/{shipID}/{height}'",
		})
	}

	const ship = ships[shipID]
	if (!ship) {
		return send(res, 400, {
			error: `ship ID '${shipID}' is invalid.`,
			code: `E_INVALID_SHIP_ID`
		})
	}

	const { protocol, hostname, port } = parse(ship.endpoint as string)
	
	const handlerName = ship.type.toLowerCase()
	const handler = require(`./${handlerName}`)
	if (!handler || typeof handler.handle != 'function') {
		console.log("[ERROR] handler missing:", handlerName)
		return send(res, 500, {
			error: `missing handler for chain type ${ship.type}.`,
			code: 'INTERNAL_ERROR',
		})
	}

	return handler.handle(ship, Number.parseInt(height))(req, res)
}
