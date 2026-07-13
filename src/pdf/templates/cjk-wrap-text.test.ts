import { describe, expect, it } from 'vitest'
import { createCjkWrapLines } from './cjk-wrap-lines'

describe('createCjkWrapLines', () => {
  it('creates Chinese break opportunities without separating closing punctuation', () => {
    expect(createCjkWrapLines('简体（测试），繁體測試。')).toEqual([
      ['简', '体', '（测', '试），', '繁', '體', '測', '試。'],
    ])
  })

  it('keeps ordinary Latin words together and preserves whitespace', () => {
    const lines = createCjkWrapLines('React TypeScript 中文')

    expect(lines).toEqual([['React ', 'TypeScript ', '中', '文']])
    expect(lines.flat().join('')).toBe('React TypeScript 中文')
  })

  it('splits an unusually long Latin token deterministically', () => {
    const source = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const [tokens] = createCjkWrapLines(source)

    expect(tokens).toHaveLength(2)
    expect(tokens?.join('')).toBe(source)
    expect(tokens?.every((token) => Array.from(token).length <= 24)).toBe(true)
  })

  it('bounds extreme punctuation runs without losing source text', () => {
    const sources = [`测${'。'.repeat(80)}`, `${'（'.repeat(80)}测`]

    for (const source of sources) {
      const [tokens] = createCjkWrapLines(source)

      expect(tokens?.join('')).toBe(source)
      expect(tokens?.every((token) => Array.from(token).length <= 24)).toBe(
        true,
      )
    }
  })

  it('keeps closing punctuation attached when bounding permits it', () => {
    const [tokens] = createCjkWrapLines(`${'a'.repeat(24)}。`)

    expect(tokens).toEqual(['a'.repeat(23), 'a。'])
  })

  it('preserves explicit line breaks and keeps a bullet with its first token', () => {
    expect(createCjkWrapLines('第一行\r\n第二行', '- ')).toEqual([
      ['- 第', '一', '行'],
      ['第', '二', '行'],
    ])
  })

  it('keeps grapheme clusters intact', () => {
    const source = '候選人e\u0301'
    const [tokens] = createCjkWrapLines(source)

    expect(tokens).toEqual(['候', '選', '人', 'e\u0301'])
    expect(tokens?.join('')).toBe(source)
  })
})
