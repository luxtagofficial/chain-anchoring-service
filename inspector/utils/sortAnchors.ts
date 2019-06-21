import { InspectedAnchor } from '../types'

// sort anchors descendingly based on `island.offsetID`
const compare = (a: InspectedAnchor, b: InspectedAnchor): number => {
  const offsetA = a.island.offsetID.toUpperCase();
  const offsetB = b.island.offsetID.toUpperCase();
  
  if (offsetA == offsetB) {
    return 0
  }
  return offsetA > offsetB ? -1 : 1
}

export default (anchors: InspectedAnchor[]) => {
	// clone `anchors` to `arr` to ensure immutability
	const arr = [...anchors]
	
	arr.sort(compare)
	return arr
}
