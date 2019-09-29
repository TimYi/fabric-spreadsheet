export default function binarySearch<T> (list: Array<T>, value: any, comparator: (t: T, value: any)=> number): T | null {
  if (list.length === 0) {
    return null
  }
  const mid = Math.floor(list.length / 2)
  let v
  if (mid === 0) {
    v = list[0]
  } else {
    v = list[mid - 1]
  }
  const compareResult = comparator(v, value)
  if (compareResult === 0) {
    return v
  } else if (compareResult < 0 && mid < list.length) {
    return binarySearch(list.slice(mid, list.length), value, comparator)
  } else if (compareResult > 0 && mid > 1) {
    return binarySearch(list.slice(0, mid - 1), value, comparator)
  }
  return null
}
