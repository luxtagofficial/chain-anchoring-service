import { parse } from 'url'
import { send } from 'micro'

import { Inspector, IInspectorOptions } from '../nem/inspector'
import { Joi, validate, getMetaError } from './utils/validator'

const metaSchema = {
	address: Joi.string().length(40).required(),
};

const fetchAnchorsArgsSchema = Joi.object().keys({
	island: Joi.string().required(),
	skipper: Joi.string().required(),
	...metaSchema,
});

const fetchAnchors = async (args: IInspectorOptions) => {
	const i = new Inspector(args)
  	return await i.fetchAnchors()
}

export const chainInfo = (endpoint) => async (res) => {  	
	const genesisHash = await Inspector.genesisHash(endpoint);
	return send(res, 200, genesisHash);
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
