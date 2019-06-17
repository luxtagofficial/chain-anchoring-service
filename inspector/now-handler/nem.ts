import { parse } from 'url'

import { Inspector, IInspectorOptions } from '../nem/inspector'

export default async (req, res) => {
	const { pathname, query = {} } = parse(req.url, true)
	const [ handlerName, height ] = pathname.split('/').splice(1)

	const { endpoint, skipper, address } = query

	if (!height) {
	  res.end(`hello from NEM1 cas inspector`);
	  return
	}

	// account can be public key or address of blockchain account.
	const inspector = new Inspector({
		endpoint,
		skipper,
		address,
	} as IInspectorOptions);
  	const anchors = await inspector.fetchAnchors();

	res.end(JSON.stringify(anchors));
};
