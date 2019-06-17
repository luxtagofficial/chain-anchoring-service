import { json, send } from 'micro'
import { Joi, validate } from '../joi-utils'

const payloadSchema = Joi.object().keys({
	inspector: {
	  name: Joi.string().required(),
	  type: Joi.string().required(),
	  endpoint: Joi.string().required(),
	  networkType: Joi.string().required(),
	  account: Joi.string().required(),
	},
	skipper: {
	  name: Joi.string().required(),
	  type: Joi.string().required(),
	  endpoint: Joi.string().required(),
	},
});

export default async (req, res) => {
	if (req.method === 'OPTIONS') {
	  return send(res, 200, '');
	}

	const payload = await json(req)
	const payloadError = validate(payloadSchema, payload)
	if (payloadError) {
		return send(res, 400, payloadError)
	}

	const { type } = payload.inspector

	const handler = require(`./${type.toLowerCase()}`)
	if (!handler) {
		return send(res, 400, "invalid inspector type")
	}

	return handler.withPayload(payload)(res)
}
