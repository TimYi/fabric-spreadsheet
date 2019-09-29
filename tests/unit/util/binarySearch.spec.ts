import binarySearch from '@/util/binarySearch'

describe('binarySearch', function () {
  it('zero element', function () {
    const result = binarySearch([], 1, (a, b) => (a - b))
    expect(result).toBeNull()
  })
  it('one element', function () {
    const result = binarySearch([1], 1, (a, b) => (a - b))
    expect(result).toBe(1)
  })
  it('two element', function () {
    const result = binarySearch([3, 5], 2, (a, b) => (a - b))
    expect(result).toBe(null)
  })
  it('three element', function () {
    const result = binarySearch([3, 4, 5], 5, (a, b) => (a - b))
    expect(result).toBe(5)
  })
  it('four element', function () {
    const result = binarySearch([3, 4, 5, 6], 3, (a, b) => (a - b))
    expect(result).toBe(3)
  })
})
