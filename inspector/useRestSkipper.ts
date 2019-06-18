import fetch from 'node-fetch'

export interface Block {
	height: string,
	hash: string,
	timestamp: string,
	uriList: Array<string>,
}

export const useRestSkipper = (skipperEndpoint: string) => {
	console.log("[INFO] using REST skipper at", skipperEndpoint)
	return {
		fetchRest: (blockHeight: number): Promise<Block> => {
			return fetch(`${skipperEndpoint}/${blockHeight}`)
				.then(resp => resp.json())
		}
	}
}

export default useRestSkipper