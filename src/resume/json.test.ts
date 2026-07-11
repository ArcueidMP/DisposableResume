import { describe, expect, it } from 'vitest'
import { createDefaultResume } from './defaults'
import {
  parseResumeJson,
  RESUME_JSON_SCHEMA_VERSION,
  serializeResumeJson,
} from './json'
import { validateResume } from './validation'

function createValidatedFixture() {
  const result = validateResume(createDefaultResume())

  if (!result.success) {
    throw new Error(
      'Expected the default fixture to satisfy the resume schema.',
    )
  }

  return result.data
}

describe('resume JSON contract', () => {
  it('round-trips the current versioned envelope', () => {
    const resume = createValidatedFixture()
    const serialized = serializeResumeJson(resume)
    const parsed = parseResumeJson(serialized)

    expect(parsed).toEqual({
      success: true,
      resume,
      sourceVersion: RESUME_JSON_SCHEMA_VERSION,
    })
  })

  it('imports an unversioned resume through the sole legacy v0 path', () => {
    const resume = createValidatedFixture()

    expect(parseResumeJson(JSON.stringify(resume))).toEqual({
      success: true,
      resume,
      sourceVersion: 0,
    })
  })

  it('rejects future versions without falling back to legacy parsing', () => {
    const resume = createValidatedFixture()

    expect(
      parseResumeJson(JSON.stringify({ schemaVersion: 2, resume })),
    ).toEqual({ success: false, code: 'unsupported-version' })
  })

  it('rejects an invalid v1 envelope without treating it as v0', () => {
    const resume = createValidatedFixture()

    expect(
      parseResumeJson(
        JSON.stringify({
          ...resume,
          schemaVersion: RESUME_JSON_SCHEMA_VERSION,
        }),
      ),
    ).toEqual({ success: false, code: 'invalid-resume' })
  })

  it('rejects unknown root and nested fields instead of stripping them', () => {
    const resume = createDefaultResume()
    const rootUnknown = {
      schemaVersion: RESUME_JSON_SCHEMA_VERSION,
      resume: createValidatedFixture(),
      futureField: true,
    }
    const nestedUnknown = {
      ...resume,
      basics: { ...resume.basics, futureField: true },
    }

    expect(parseResumeJson(JSON.stringify(rootUnknown))).toEqual({
      success: false,
      code: 'invalid-resume',
    })
    expect(parseResumeJson(JSON.stringify(nestedUnknown))).toEqual({
      success: false,
      code: 'invalid-resume',
    })
  })

  it('distinguishes malformed JSON from an invalid resume', () => {
    expect(parseResumeJson('{')).toEqual({
      success: false,
      code: 'invalid-json',
    })
    expect(parseResumeJson('null')).toEqual({
      success: false,
      code: 'invalid-resume',
    })
  })
})
