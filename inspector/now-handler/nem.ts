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
	const i = new Inspector(args);
  	return await i.fetchAnchors();
}

export const withPayload = ({inspector, skipper}) => async (res) => {
	const { meta } = inspector

	const metaError = getMetaError(metaSchema, inspector)
	if (metaError) {
		return send(res, 400, metaError)
	}

	const anchors = await fetchAnchors({
		endpoint: inspector.island,
		skipper: skipper.endpoint,

		// meta args
		address: meta.address,
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

  	const anchors = await fetchAnchors({ ...(<unknown>query) } as IInspectorOptions);
  	return send(res, 200, { anchors });
};
