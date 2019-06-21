import fetch from 'node-fetch'
import * as services from '../../_proto/anchor_grpc_pb';
import * as messages from '../../_proto/anchor_pb';

const LOCK_NAME = 'LuxTag Chain Anchoring Service'
const LOCK_VERSION = '1.0.1'

const currentBlockHeight = async (endpoint: string): Promise<string> => {
    return fetch(endpoint + '/chain/height')
        .then(resp => resp.json())
        .then(json => json.height.toString())
}

const currentBlock = async (endpoint: string): Promise<messages.Block> => {
    const height: string = await currentBlockHeight(endpoint)
    
    return fetch(endpoint + '/block/at/public', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          height: Number.parseInt(height)
        })
      })
      .then(resp => resp.json())
      .then(json => {
        const timestamp = json.transaction.timestamp
        const hash = json.meta.hash.data

        const b = new messages.Block()
        b.setHeight(height)
        b.setHash(hash)
        b.setTimestamp(timestamp)
        
        return b
    })
}

export const getLock = async (endpoint: string): Promise<messages.Lock> => {
	const block = await currentBlock(endpoint)

	const lock = new messages.Lock()
	lock.setVersion(LOCK_VERSION)
	lock.setName(LOCK_NAME)
	lock.setType(messages.IslandType['NEM1'])
	lock.setBlock(block)

	return lock
}