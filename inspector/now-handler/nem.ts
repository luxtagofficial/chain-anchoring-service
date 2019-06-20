import { parse } from 'url'
import { send } from 'micro'

import { Inspector, InspectorArgs } from '../nem/inspector'
import { Joi, validate, getMetaError } from './utils/validator'
import { ErrorObject } from '../types'

const metaSchema = {
	address: Joi.string().length(40).required(),
};

const fetchAnchorsArgsSchema = Joi.object().keys({
	island: Joi.string().required(),
	skipper: Joi.string().required(),
	...metaSchema,
});

const fetchAnchors = async (args: InspectorArgs, offset: string) => {
	const i = new Inspector(args)
	const resp = await i.fetchAnchors(offset)
	if ((resp as ErrorObject).error) {
		return resp
	}

  	return { anchors: resp }
}

export const chainInfo = (endpoint) => async (res) => {  	
	const chainInfo = await Inspector.chainInfo(endpoint);
	return send(res, 200, chainInfo);
}

export const withPayload = ({inspector, skipper}) => async (res) => {
	const { meta } = inspector

	const metaError = getMetaError(metaSchema, inspector)
	if (metaError) {
		return send(res, 400, metaError)
	}

	const resp = await fetchAnchors({
		island: inspector.island,
		skipper: skipper.endpoint,

		// meta args
		address: meta.address,
	});

	return send(res, 200, resp);
}
