import { InspectedAnchor } from '../types'

// sort anchors descendingly based on offsetID
const compare = (a, b) => {
  const offsetA = a.offsetID.toUpperCase();
  const offsetB = b.offsetID.toUpperCase();
  
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
