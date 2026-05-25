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

  it('falls back to Classic ATS for an unknown runtime value', () => {
    expect(getResumePdfTemplate('unknown-template' as ResumeTemplate)).toBe(
      resumePdfTemplates['classic-ats'],
    )
  })
})
