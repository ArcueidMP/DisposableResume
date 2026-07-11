import { describe, expect, it } from 'vitest'
import { createDefaultResume } from './defaults'
import { resumeLimits, resumeSchema } from './schema'
import type { ResumeDraft } from './types'

function duplicateFirstEntry<T>(entries: T[]) {
  const firstEntry = entries[0]

  if (firstEntry === undefined) {
    throw new Error('Expected a default entry.')
  }

  return [firstEntry, structuredClone(firstEntry)]
}

describe('resumeSchema identity contracts', () => {
  it.each([
    {
      mutate: (resume: ResumeDraft) => {
        resume.work = duplicateFirstEntry(resume.work)
      },
      section: 'work',
    },
    {
      mutate: (resume: ResumeDraft) => {
        resume.education = duplicateFirstEntry(resume.education)
      },
      section: 'education',
    },
    {
      mutate: (resume: ResumeDraft) => {
        resume.projects = duplicateFirstEntry(resume.projects)
      },
      section: 'projects',
    },
  ])('rejects duplicate IDs in $section entries', ({ mutate, section }) => {
    const resume = createDefaultResume()

    mutate(resume)

    const result = resumeSchema.safeParse(resume)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: [section, 1, 'id'] }),
        ]),
      )
    }
  })

  it('rejects IDs beyond the documented limit', () => {
    const resume = createDefaultResume()

    resume.work[0]!.id = 'w'.repeat(resumeLimits.id + 1)

    const result = resumeSchema.safeParse(resume)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['work', 0, 'id'] }),
        ]),
      )
    }
  })
})
