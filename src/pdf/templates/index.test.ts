import { describe, expect, it } from 'vitest'
import { resumeTemplateOptions } from '../../resume/schema'
import type { ResumeTemplate } from '../../resume/types'
import { getResumePdfTemplate, resumePdfTemplates } from './index'

describe('resume PDF template registry', () => {
  it('has one PDF template for every resume template option', () => {
    expect(Object.keys(resumePdfTemplates).sort()).toEqual(
      resumeTemplateOptions.map((template) => template.id).sort(),
    )
  })

  it('returns the selected template component', () => {
    expect(getResumePdfTemplate('classic-ats')).toBe(
      resumePdfTemplates['classic-ats'],
    )
    expect(getResumePdfTemplate('modern-ats')).toBe(
      resumePdfTemplates['modern-ats'],
    )
    expect(getResumePdfTemplate('chinese-clean')).toBe(
      resumePdfTemplates['chinese-clean'],
    )
  })

  it.each(['unknown-template', 'toString'])(
    'rejects unsupported runtime value %s instead of falling back',
    (template) => {
      expect(() => getResumePdfTemplate(template as ResumeTemplate)).toThrow(
        'Unsupported resume PDF template.',
      )
    },
  )
})
