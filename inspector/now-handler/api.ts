import { json, send } from 'micro'
import { Joi, validate } from './utils/validator'

const payloadSchema = Joi.object().keys({
	inspector: {
	  name: Joi.string().required(),
	  island: Joi.string().required(),
	  type: Joi.string().required(),
	  
	  // inspector.meta definition is per-chain basis.
	  meta: Joi.object(),
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
		return send(res, 400, {
			error: "invalid inspector type",
			code: "E_INVALID_INSPECTOR_TYPE",
		})
	}

	return handler.withPayload(payload)(res)
}
