import { z } from 'zod'
import { resumeSchema } from './schema'
import type { Resume } from './types'

export const MAX_RESUME_JSON_BYTES = 1024 * 1024
export const RESUME_JSON_SCHEMA_VERSION = 1

const resumeJsonV1Schema = z.strictObject({
  schemaVersion: z.literal(RESUME_JSON_SCHEMA_VERSION),
  resume: resumeSchema,
})

export type ResumeJsonParseResult =
  | { success: true; resume: Resume; sourceVersion: 0 | 1 }
  | {
      success: false
      code: 'invalid-json' | 'invalid-resume' | 'unsupported-version'
    }

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseResumeJson(text: string): ResumeJsonParseResult {
  let decoded: unknown

  try {
    decoded = JSON.parse(text) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, code: 'invalid-json' }
    }

    throw error
  }

  if (isJsonObject(decoded) && Object.hasOwn(decoded, 'schemaVersion')) {
    if (decoded.schemaVersion !== RESUME_JSON_SCHEMA_VERSION) {
      return { success: false, code: 'unsupported-version' }
    }

    const versionedResume = resumeJsonV1Schema.safeParse(decoded)

    if (!versionedResume.success) {
      return { success: false, code: 'invalid-resume' }
    }

    return {
      success: true,
      resume: versionedResume.data.resume,
      sourceVersion: RESUME_JSON_SCHEMA_VERSION,
    }
  }

  const legacyResume = resumeSchema.safeParse(decoded)

  if (!legacyResume.success) {
    return { success: false, code: 'invalid-resume' }
  }

  return { success: true, resume: legacyResume.data, sourceVersion: 0 }
}

export function serializeResumeJson(resume: Resume) {
  return JSON.stringify(
    {
      schemaVersion: RESUME_JSON_SCHEMA_VERSION,
      resume,
    },
    null,
    2,
  )
}
