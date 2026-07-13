/// <reference types="node" />

import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const fontDirectory = join(
  process.cwd(),
  'src',
  'pdf',
  'fonts',
  'chiron-hei-hk',
)
const registrationModule = join(
  process.cwd(),
  'src',
  'pdf',
  'fonts',
  'register-chinese-clean-fonts.ts',
)
const fonts = [
  {
    filename: 'ChironHeiHK-Text-R.ttf',
    sha256: '502db3c8970386d7388165cd0226df6f2d8fe77aab2bab3eed6e1bf801b2691b',
  },
  {
    filename: 'ChironHeiHK-Text-B.ttf',
    sha256: '4368f9a4f5d71b09742fe18854d69bf3374ee5d90cad9874e6a8572ae04d6d0c',
  },
] as const

describe('vendored Chiron Hei HK fonts', () => {
  it.each(fonts)(
    'keeps $filename pinned and deployable',
    ({ filename, sha256 }) => {
      const path = join(fontDirectory, filename)
      const contents = readFileSync(path)

      expect(createHash('sha256').update(contents).digest('hex')).toBe(sha256)
      expect(statSync(path).size).toBeLessThan(25 * 1024 * 1024)
    },
  )

  it('ships the upstream license and provenance notice', () => {
    expect(readFileSync(join(fontDirectory, 'OFL-1.1.txt'), 'utf8')).toContain(
      'SIL OPEN FONT LICENSE Version 1.1',
    )
    expect(readFileSync(join(fontDirectory, 'NOTICE.md'), 'utf8')).toContain(
      'version 2.609',
    )
  })

  it('registers only pinned relative assets instead of remote font URLs', () => {
    const source = readFileSync(registrationModule, 'utf8')

    expect(source).toContain("'./chiron-hei-hk/ChironHeiHK-Text-R.ttf'")
    expect(source).toContain("'./chiron-hei-hk/ChironHeiHK-Text-B.ttf'")
    expect(source).not.toMatch(/https?:\/\//)
  })
})
