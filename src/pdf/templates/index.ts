import { createElement, type ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'
import type { ResumeTemplate } from '../../resume/types'
import { ChineseCleanTemplate } from './chinese-clean'
import { ClassicAtsTemplate } from './classic-ats'
import { ModernAtsTemplate } from './modern-ats'

export type ResumePdfTemplateRenderer = (
  presentation: ResumePresentation,
) => ReactNode

export const resumePdfTemplates = {
  'classic-ats': (presentation) =>
    createElement(ClassicAtsTemplate, { presentation }),
  'modern-ats': (presentation) =>
    createElement(ModernAtsTemplate, { presentation }),
  'chinese-clean': (presentation) =>
    createElement(ChineseCleanTemplate, { presentation }),
} satisfies Record<ResumeTemplate, ResumePdfTemplateRenderer>

export function getResumePdfTemplate(template: ResumeTemplate) {
  if (!Object.hasOwn(resumePdfTemplates, template)) {
    throw new Error('Unsupported resume PDF template.')
  }

  return resumePdfTemplates[template]
}
