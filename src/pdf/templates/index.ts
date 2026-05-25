import type { ComponentType } from 'react'
import type { Resume, ResumeTemplate } from '../../resume/types'
import { ChineseCleanTemplate } from './chinese-clean'
import { ClassicAtsTemplate } from './classic-ats'
import { ModernAtsTemplate } from './modern-ats'

export type ResumePdfTemplate = ComponentType<{ resume: Resume }>

export const resumePdfTemplates = {
  'classic-ats': ClassicAtsTemplate,
  'modern-ats': ModernAtsTemplate,
  'chinese-clean': ChineseCleanTemplate,
} satisfies Record<ResumeTemplate, ResumePdfTemplate>

export function getResumePdfTemplate(template: ResumeTemplate) {
  return resumePdfTemplates[template] ?? resumePdfTemplates['classic-ats']
}
