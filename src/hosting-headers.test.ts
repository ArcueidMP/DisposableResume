/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const headersFile = join(process.cwd(), 'public', '_headers')

function readRootHeaders() {
  const lines = readFileSync(headersFile, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  expect(lines.shift()).toBe('/*')

  const entries = lines.map((line) => {
    const separator = line.indexOf(':')

    if (separator < 1) {
      throw new Error(`Invalid Cloudflare Pages header line: ${line}`)
    }

    return [line.slice(0, separator), line.slice(separator + 1).trim()] as const
  })
  const names = entries.map(([name]) => name)

  expect(new Set(names).size, 'Headers must not be repeated.').toBe(
    names.length,
  )

  return new Map(entries)
}

function parseContentSecurityPolicy(policy: string) {
  const entries = policy.split(';').map((rawDirective) => {
    const [name, ...sources] = rawDirective.trim().split(/\s+/)

    if (name === undefined || name === '' || sources.length === 0) {
      throw new Error(`Invalid CSP directive: ${rawDirective}`)
    }

    return [name, sources.join(' ')] as const
  })
  const names = entries.map(([name]) => name)

  expect(new Set(names).size, 'CSP directives must not be repeated.').toBe(
    names.length,
  )

  return Object.fromEntries(entries)
}

describe('Cloudflare Pages security headers', () => {
  it('locks the static app to local resources required by browser PDF export', () => {
    const headers = readRootHeaders()
    const policy = headers.get('Content-Security-Policy')

    if (policy === undefined) {
      throw new Error('Expected a Content-Security-Policy header.')
    }

    const directives = parseContentSecurityPolicy(policy)

    expect(directives).toEqual({
      'base-uri': "'none'",
      'connect-src': "'self' data:",
      'default-src': "'none'",
      'font-src': "'none'",
      'form-action': "'none'",
      'frame-ancestors': "'none'",
      'frame-src': "'none'",
      'img-src': "'self' data: blob:",
      'manifest-src': "'self'",
      'media-src': "'none'",
      'object-src': "'none'",
      'script-src': "'self' 'wasm-unsafe-eval'",
      'style-src': "'self'",
      'worker-src': "'none'",
    })
    expect(Object.values(directives).join(' ')).not.toMatch(
      /(?:^|\s)\*(?:\s|$)/,
    )
  })

  it('sets browser isolation and transport hardening headers', () => {
    expect(Object.fromEntries(readRootHeaders())).toMatchObject({
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Permissions-Policy':
        'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
      'Referrer-Policy': 'no-referrer',
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    })
  })
})
