/// <reference types="node" />

import { createElement } from 'react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createDefaultResume } from './resume/defaults'
import { serializeResumeJson } from './resume/json'
import { validateResume } from './resume/validation'
import { useResumeStore } from './store/resume-store'

const sourceRoot = join(process.cwd(), 'src')
const editMarker = 'FAKE_PRIVACY_MARKER_EDIT_72A6'
const importMarker = 'FAKE_PRIVACY_MARKER_IMPORT_94C1'
const privacyMarkers = [editMarker, importMarker]

const architectureRules = [
  {
    name: 'persistent browser storage',
    pattern: /\b(?:localStorage|indexedDB|document\.cookie)\b/,
  },
  {
    name: 'state persistence middleware',
    pattern: /\bpersist\s*\(/,
  },
  {
    name: 'resume data in browser navigation URLs',
    pattern:
      /\b(?:URLSearchParams|location\.search|history\.(?:pushState|replaceState))\b/,
  },
  {
    name: 'server-side or link-managed PDF rendering',
    pattern:
      /\b(?:renderToFile|renderToStream|renderToBuffer|PDFDownloadLink|BlobProvider)\b/,
  },
  {
    name: 'unapproved PDF font or emoji registration',
    pattern: /\b(?:Font\.register|registerEmojiSource)\s*\(/,
  },
  {
    name: 'application-owned network transport',
    pattern:
      /(?:\bfetch\s*\(|\b(?:XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b)/,
  },
  {
    name: 'console output',
    pattern: /\bconsole\.(?:debug|error|info|log|trace|warn)\b/,
  },
] as const

type DownloadRecord = {
  blob: Blob
  objectUrl: string
}

const restoreCallbacks: Array<() => void> = []

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

function replaceProperty(
  target: object,
  property: PropertyKey,
  value: unknown,
) {
  const descriptor = Object.getOwnPropertyDescriptor(target, property)

  Object.defineProperty(target, property, {
    configurable: true,
    value,
    writable: true,
  })

  restoreCallbacks.push(() => {
    if (descriptor === undefined) {
      Reflect.deleteProperty(target, property)
      return
    }

    Object.defineProperty(target, property, descriptor)
  })
}

function hasPrivacyMarker(value: string) {
  return privacyMarkers.some((marker) => value.includes(marker))
}

async function valueContainsPrivacyMarker(
  value: unknown,
  visited = new Set<object>(),
): Promise<boolean> {
  if (typeof value === 'string') {
    return hasPrivacyMarker(value)
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol' ||
    typeof value === 'function'
  ) {
    return false
  }

  if (value instanceof URL || value instanceof URLSearchParams) {
    return hasPrivacyMarker(value.toString())
  }

  if (value instanceof Request) {
    if (hasPrivacyMarker(value.url)) {
      return true
    }

    return value.body === null
      ? false
      : hasPrivacyMarker(await value.clone().text())
  }

  if (value instanceof Blob) {
    return hasPrivacyMarker(await value.text())
  }

  if (value instanceof FormData) {
    for (const [key, entryValue] of value.entries()) {
      if (
        hasPrivacyMarker(key) ||
        (await valueContainsPrivacyMarker(entryValue, visited))
      ) {
        return true
      }
    }

    return false
  }

  if (visited.has(value)) {
    return false
  }

  visited.add(value)

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (await valueContainsPrivacyMarker(entry, visited)) {
        return true
      }
    }

    return false
  }

  if (value instanceof Error) {
    return hasPrivacyMarker(`${value.name}: ${value.message}`)
  }

  if (Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, entryValue] of Object.entries(value)) {
      if (
        hasPrivacyMarker(key) ||
        (await valueContainsPrivacyMarker(entryValue, visited))
      ) {
        return true
      }
    }
  }

  return false
}

async function expectNoPrivacyMarker(
  boundary: string,
  calls: readonly (readonly unknown[])[],
) {
  const leakedCalls: number[] = []

  for (const [index, call] of calls.entries()) {
    if (await valueContainsPrivacyMarker(call)) {
      leakedCalls.push(index + 1)
    }
  }

  expect(leakedCalls, `${boundary} received fake resume marker data`).toEqual(
    [],
  )
}

function getNetworkUrl(input: unknown) {
  if (input instanceof Request) {
    return input.url
  }

  if (input instanceof URL) {
    return input.href
  }

  return String(input)
}

function expectOnlyLocalNetworkUrls(
  boundary: string,
  calls: readonly (readonly unknown[])[],
) {
  const urls = calls.map((call) => getNetworkUrl(call[0]))
  const nonLocalUrls = urls.filter(
    (url) => !url.startsWith('blob:') && !url.startsWith('data:'),
  )

  expect(nonLocalUrls, `${boundary} attempted a non-local network URL`).toEqual(
    [],
  )
}

describe('privacy boundaries', () => {
  beforeEach(() => {
    useResumeStore.getState().resetToDefaults()
  })

  afterEach(() => {
    vi.restoreAllMocks()

    for (const restore of restoreCallbacks.splice(0).reverse()) {
      restore()
    }
  })

  it('keeps a small set of architecture-level privacy prohibitions', () => {
    const violations = collectSourceFiles(sourceRoot)
      .filter((filePath) => /\.(ts|tsx)$/.test(filePath))
      .filter((filePath) => !filePath.includes('.test.'))
      .filter((filePath) => !filePath.endsWith(join('test', 'setup.ts')))
      .flatMap((filePath) => {
        const contents = readFileSync(filePath, 'utf8')

        return architectureRules
          .filter(({ pattern }) => pattern.test(contents))
          .map(({ name }) => ({
            file: relative(process.cwd(), filePath),
            rule: name,
          }))
      })

    expect(violations).toEqual([])
  })

  it('keeps fake marker data local across editing, import, JSON export, and PDF export', async () => {
    const fetchCalls: unknown[][] = []
    const originalFetch = globalThis.fetch.bind(globalThis)
    const monitoredFetch = vi.fn(async (...args: Parameters<typeof fetch>) => {
      fetchCalls.push(args)
      return originalFetch(...args)
    })
    const beacon = vi.fn(() => true)
    const webSocket = vi.fn(function WebSocketBoundary() {})
    const indexedDbOpen = vi.fn()
    const indexedDbDelete = vi.fn()
    const localStorageSet = vi.fn()
    const localStorageRemove = vi.fn()
    const localStorageClear = vi.fn()
    const sessionStorageSet = vi.fn()
    const sessionStorageRemove = vi.fn()
    const sessionStorageClear = vi.fn()
    const createdDownloads: DownloadRecord[] = []
    const revokedObjectUrls: string[] = []
    const clickedDownloads: Array<{ download: string; href: string }> = []

    replaceProperty(globalThis, 'fetch', monitoredFetch)
    replaceProperty(navigator, 'sendBeacon', beacon)
    replaceProperty(globalThis, 'WebSocket', webSocket)
    replaceProperty(globalThis, 'indexedDB', {
      deleteDatabase: indexedDbDelete,
      open: indexedDbOpen,
    })
    replaceProperty(globalThis, 'localStorage', {
      clear: localStorageClear,
      getItem: vi.fn(() => null),
      key: vi.fn(() => null),
      length: 0,
      removeItem: localStorageRemove,
      setItem: localStorageSet,
    })
    replaceProperty(globalThis, 'sessionStorage', {
      clear: sessionStorageClear,
      getItem: vi.fn(() => null),
      key: vi.fn(() => null),
      length: 0,
      removeItem: sessionStorageRemove,
      setItem: sessionStorageSet,
    })
    replaceProperty(
      URL,
      'createObjectURL',
      vi.fn((blob: Blob) => {
        const objectUrl = `blob:privacy-boundary/${createdDownloads.length + 1}`

        createdDownloads.push({ blob, objectUrl })
        return objectUrl
      }),
    )
    replaceProperty(
      URL,
      'revokeObjectURL',
      vi.fn((objectUrl: string) => {
        revokedObjectUrls.push(objectUrl)
      }),
    )

    const xhrOpen = vi
      .spyOn(XMLHttpRequest.prototype, 'open')
      .mockImplementation(() => undefined)
    const xhrSend = vi
      .spyOn(XMLHttpRequest.prototype, 'send')
      .mockImplementation(() => undefined)
    const consoleSpies = [
      vi.spyOn(console, 'debug').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'trace').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    ]

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function recordLocalDownload(this: HTMLAnchorElement) {
        clickedDownloads.push({ download: this.download, href: this.href })
      },
    )

    render(createElement(App))

    expect(screen.getByLabelText('Name')).toHaveAttribute('autocomplete', 'off')
    expect(screen.getByLabelText('Name')).toHaveAttribute('spellcheck', 'false')

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: editMarker },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))

    const importedDraft = createDefaultResume()

    importedDraft.basics.name = importMarker

    const validatedImport = validateResume(importedDraft)

    if (!validatedImport.success) {
      throw new Error('Expected the fake privacy marker fixture to validate.')
    }

    fireEvent.change(screen.getByLabelText('Import resume JSON'), {
      target: {
        files: [
          new File(
            [serializeResumeJson(validatedImport.data)],
            'fake-privacy-marker.json',
            { type: 'application/json' },
          ),
        ],
      },
    })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 3, name: importMarker }),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))
    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    await waitFor(
      () => {
        expect(screen.getByText('Generated PDF locally.')).toBeInTheDocument()
      },
      { timeout: 15_000 },
    )

    const jsonDownloads = createdDownloads.filter(
      ({ blob }) => blob.type === 'application/json',
    )
    const pdfDownloads = createdDownloads.filter(
      ({ blob }) => blob.type === 'application/pdf',
    )

    expect(jsonDownloads).toHaveLength(2)
    expect(JSON.parse(await jsonDownloads[0]!.blob.text())).toMatchObject({
      resume: { basics: { name: editMarker } },
    })
    expect(JSON.parse(await jsonDownloads[1]!.blob.text())).toMatchObject({
      resume: { basics: { name: importMarker } },
    })
    expect(pdfDownloads).toHaveLength(1)
    expect(await pdfDownloads[0]!.blob.slice(0, 5).text()).toBe('%PDF-')
    expect(clickedDownloads.map(({ download }) => download)).toEqual([
      expect.stringMatching(/\.json$/),
      expect.stringMatching(/\.json$/),
      expect.stringMatching(/\.pdf$/),
    ])
    expect(clickedDownloads.map(({ href }) => href)).toEqual(
      createdDownloads.map(({ objectUrl }) => objectUrl),
    )
    expect(revokedObjectUrls).toEqual(
      createdDownloads.map(({ objectUrl }) => objectUrl),
    )

    expectOnlyLocalNetworkUrls('fetch', fetchCalls)
    expectOnlyLocalNetworkUrls('XMLHttpRequest', xhrOpen.mock.calls)
    await expectNoPrivacyMarker('fetch', fetchCalls)
    await expectNoPrivacyMarker('XMLHttpRequest.open', xhrOpen.mock.calls)
    await expectNoPrivacyMarker('XMLHttpRequest.send', xhrSend.mock.calls)
    await expectNoPrivacyMarker('sendBeacon', beacon.mock.calls)
    await expectNoPrivacyMarker('WebSocket', webSocket.mock.calls)
    await expectNoPrivacyMarker(
      'console',
      consoleSpies.flatMap((spy) => spy.mock.calls),
    )

    expect(localStorageSet).not.toHaveBeenCalled()
    expect(localStorageRemove).not.toHaveBeenCalled()
    expect(localStorageClear).not.toHaveBeenCalled()
    expect(sessionStorageSet).not.toHaveBeenCalled()
    expect(sessionStorageRemove).not.toHaveBeenCalled()
    expect(sessionStorageClear).not.toHaveBeenCalled()
    expect(indexedDbOpen).not.toHaveBeenCalled()
    expect(indexedDbDelete).not.toHaveBeenCalled()
  }, 20_000)
})
