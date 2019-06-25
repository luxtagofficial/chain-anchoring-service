import fetch from 'node-fetch'
import * as services from '../../_proto/anchor_grpc_pb';
import * as messages from '../../_proto/anchor_pb';

const LOCK_NAME = 'LuxTag-X-Chain'
const LOCK_VERSION = '0.2.0.2'
const LOCK_TYPE = messages.IslandType.NEM2

const currentBlockHeight = async (endpoint: string): Promise<string> => {
	return fetch(endpoint + '/diagnostic/storage')
		.then(resp => resp.json())
		.then(json => json.numBlocks.toString())
}

const CATAPULT_EPOCH_MS = 1459468800000
const uintTimestampToUtc = (uintTimestamp): number => {
	const [ ts, multiplier ] = uintTimestamp
	
	// 4294967296 is 23^2 (uint conversion)
	const long2val = ts + (multiplier * 4294967296)
	
	const utcMs = long2val + CATAPULT_EPOCH_MS
	return utcMs
}

const currentBlock = async (endpoint: string): Promise<messages.Block> => {
	const height: string = await currentBlockHeight(endpoint)
	return fetch(endpoint + '/block/' + height)
		.then(resp => resp.json())
		.then(json => {
			const timestamp = uintTimestampToUtc(json.block.timestamp)
			const hash = json.meta.hash

			const b = new messages.Block()
			b.setHash(hash)
			b.setTimestamp(timestamp.toString())
			b.setHeight(height)
			
			return b
		})
}

export const getLock = async (endpoint: string): Promise<messages.Lock> => {
	const block = await currentBlock(endpoint)

	const lock = new messages.Lock()
	lock.setType(LOCK_TYPE)
	lock.setVersion(LOCK_VERSION)
	lock.setName(LOCK_NAME)
	lock.setBlock(block)

	return lock
}