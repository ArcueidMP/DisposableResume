/// <reference types="node" />

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourceRoot = join(process.cwd(), 'src')
const forbiddenFragments = [
  ['local', 'Storage'].join(''),
  ['session', 'Storage'].join(''),
  ['indexed', 'DB'].join(''),
  ['navigator', '.sendBeacon'].join(''),
  ['fetch', '('].join(''),
  ['XMLHttp', 'Request'].join(''),
  ['console', '.'].join(''),
  ['persist', '('].join(''),
  ['Font', '.register'].join(''),
  ['register', 'EmojiSource'].join(''),
  ['PDF', 'DownloadLink'].join(''),
  ['Blob', 'Provider'].join(''),
  ['render', 'ToFile'].join(''),
  ['render', 'ToStream'].join(''),
  ['render', 'ToBuffer'].join(''),
  ['Web', 'Socket'].join(''),
  ['Event', 'Source'].join(''),
  ['document', '.cookie'].join(''),
  ['URL', 'SearchParams'].join(''),
  ['location', '.search'].join(''),
  ['history', '.pushState'].join(''),
  ['history', '.replaceState'].join(''),
]

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = join(directory, entry)
    const stat = statSync(entryPath)

    if (stat.isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    return entryPath
  })
}

describe('privacy boundaries', () => {
  it('does not use blocked persistence, telemetry, network, or persist APIs in app code', () => {
    const matches = collectSourceFiles(sourceRoot)
      .filter((filePath) => /\.(ts|tsx)$/.test(filePath))
      .filter((filePath) => !filePath.includes('.test.'))
      .filter((filePath) => !filePath.endsWith(join('test', 'setup.ts')))
      .flatMap((filePath) => {
        const contents = readFileSync(filePath, 'utf8')

        return forbiddenFragments
          .filter((fragment) => contents.includes(fragment))
          .map((fragment) => ({ filePath, fragment }))
      })

    expect(matches).toEqual([])
  })
})
