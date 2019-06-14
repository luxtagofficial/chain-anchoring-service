import { parse } from 'url'

import { Inspector, IInspectorOptions } from '../nem2/inspector'

export default async function (req, res) {
	const { pathname, query = {} } = parse(req.url, true)
	const [ handlerName, height ] = pathname.split('/').splice(1)

	const { endpoint, publicKey, networkType, skipper } = query

	// TODO: handle height or pagination

	// account can be public key or address of blockchain account.
	const inspector = new Inspector({
		endpoint,
		skipper,
		publicKey,
		networkType,
	} as IInspectorOptions);
  	const anchors = await inspector.fetchAnchors();

	res.end(JSON.stringify(anchors));
};
