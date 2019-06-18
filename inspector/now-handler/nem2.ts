import { parse } from 'url'
import { send } from 'micro'

import { Inspector, IInspectorOptions } from '../nem2/inspector'
import { Joi, validate, getMetaError } from './utils/validator'

const fetchAnchorsArgsSchema = Joi.object().keys({
	endpoint: Joi.string().required(),
	publicKey: Joi.string().required(),
	networkType: Joi.string().required(),
	skipper: Joi.string().required(),
});

const fetchAnchors = async (args: IInspectorOptions) => {
	const i = new Inspector(args);
  	return await i.fetchAnchors();
}

export const withPayload = ({inspector, skipper}) => async (res) => {
	const anchors = await fetchAnchors({
		endpoint: inspector.endpoint,
		skipper: skipper.endpoint,

		publicKey: inspector.account,
		networkType: inspector.networkType,
	});
	return send(res, 200, { anchors });
}

export default async (req, res) => {
	const { pathname, query = {} } = parse(req.url, true)
	const [ handlerName, height ] = pathname.split('/').splice(1)

	const payloadError = validate(fetchAnchorsArgsSchema, query)
	if (payloadError) {
		return send(res, 400, payloadError)
	}

	// TODO: handle height or pagination

	const anchors = await fetchAnchors({ ...(<unknown>query) } as IInspectorOptions);
	return send(res, 200, { anchors });
};
