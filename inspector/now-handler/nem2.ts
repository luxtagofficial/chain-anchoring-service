import { send } from 'micro';
import { Inspector, InspectorArgs } from '../nem2/inspector';
import { ErrorObject } from '../types';
import { getMetaError, Joi } from './utils/validator';

const metaSchema = {
	networkType: Joi.string().required(),
	account: Joi.string().length(64).required(),
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

export const withPayload = ({offset, inspector, skipper}) => async (res) => {
	const { meta } = inspector

	const metaError = getMetaError(metaSchema, inspector)
	if (metaError) {
		return send(res, 400, metaError)
	}

	const resp = await fetchAnchors({
		island: inspector.island,
		skipper: skipper.endpoint,

		// meta args
		publicKey: meta.account,
		networkType: meta.networkType,
	}, offset);

	return send(res, 200, resp);
}
