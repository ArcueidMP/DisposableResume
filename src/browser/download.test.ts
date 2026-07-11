import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob } from './download'

const originalCreateObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
)
const originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
)

function restoreUrlMethod(
  name: 'createObjectURL' | 'revokeObjectURL',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor === undefined) {
    Reflect.deleteProperty(URL, name)
    return
  }

  Object.defineProperty(URL, name, descriptor)
}

describe('downloadBlob', () => {
  const createObjectUrl = vi.fn(() => 'blob:fixture-download')
  const revokeObjectUrl = vi.fn()

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    createObjectUrl.mockClear()
    revokeObjectUrl.mockClear()
    restoreUrlMethod('createObjectURL', originalCreateObjectUrl)
    restoreUrlMethod('revokeObjectURL', originalRevokeObjectUrl)
  })

  it('downloads with an object URL and removes the temporary anchor', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const blob = new Blob(['fixture'], { type: 'text/plain' })

    downloadBlob(blob, 'fixture.txt')

    expect(createObjectUrl).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:fixture-download')
    expect(document.querySelector('a[href="blob:fixture-download"]')).toBeNull()
  })

  it('still cleans up when the browser rejects the click', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('Fixture browser rejected the download.')
    })

    expect(() => downloadBlob(new Blob(['fixture']), 'fixture.txt')).toThrow(
      'Fixture browser rejected the download.',
    )
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:fixture-download')
    expect(document.querySelector('a[href="blob:fixture-download"]')).toBeNull()
  })
})
