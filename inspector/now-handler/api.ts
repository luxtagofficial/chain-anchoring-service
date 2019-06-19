import { parse } from 'url'
import { json, send } from 'micro'
import { Joi, validate } from './utils/validator'

const chainInfoSchema = Joi.object().keys({
	type: Joi.string().required(),
	endpoint: Joi.string().uri().required(),
})

const anchorsSchema = Joi.object().keys({
	inspector: {
	  name: Joi.string().required(),
	  island: Joi.string().uri().required(),
	  type: Joi.string().required(),
	  
	  // inspector.meta definition is per-chain basis.
	  meta: Joi.object(),
	},
	skipper: {
	  name: Joi.string().required(),
	  type: Joi.string().required(),
	  endpoint: Joi.string().uri().required(),
	},
});

const parsePayload = async (req) => {
	try {
		switch (req.method) {
			case 'POST':
				return await json(req)
			case 'GET':
				const { query = {payload: '{}'} } = parse(req.url, true)
				return JSON.parse(query.payload as string)
		}
	} catch (e) {}

	return {}
}

const handleUpstreamError = (e, res) => {
	const code = 'E_UPSTREAM_ERROR'
	const errMsg = e.message.toLowerCase()
	if (errMsg.includes('enotfound')) {
		return send(res, 400, { 
			error: `endpoint is not online.`,
			code,
		});
	}

	if (errMsg.includes('"port" option should be')) {
		return send(res, 400, { 
			error: `endpoint's port is invalid.`,
			code,
		});
	}

	const error = 'unhandled upstream error. please see server log.'
	console.log(`[ERROR] ${error}: '${e.message}'\n`, e)

	return send(res, 500, { 
		error,
		code
	});
}

const routes = {
	'/api/chain/info': async (req, res) => {
		let payload = await parsePayload(req)
		const payloadError = validate(chainInfoSchema, payload)
		if (payloadError) {
			return send(res, 400, payloadError)
		}

		const { type, endpoint } = payload
		const handler = require(`./${type.toLowerCase()}`)
		if (!handler) {
			return send(res, 400, {
				error: "invalid inspector type",
				code: "E_INVALID_INSPECTOR_TYPE",
			})
		}

		try {
			return await handler.chainInfo(endpoint)(res)
		} catch (e) {
			return handleUpstreamError(e, res)
	  	}
	},
	'/api/anchors': async (req, res) => {
		const payload = await parsePayload(req)
		const payloadError = validate(anchorsSchema, payload)
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

		try {
			return await handler.withPayload(payload)(res)
		} catch (e) {
			return handleUpstreamError(e, res)
		}
	}
}

export default async (req, res) => {
	if (req.method === 'OPTIONS') {
	  return send(res, 200, '');
	}

	const { pathname } = parse(req.url)
	return routes[pathname](req, res)
}
