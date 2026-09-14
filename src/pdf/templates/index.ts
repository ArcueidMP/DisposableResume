import { createElement, type ReactNode } from 'react'
import type { ResumePresentation } from '../../resume/presentation'
import type { ResumeTemplate } from '../../resume/types'
import type { ResumePdfTypography } from '../fonts/resume-pdf-typography'
import { ChineseCleanTemplate } from './chinese-clean'
import { ClassicAtsTemplate } from './classic-ats'
import { ModernAtsTemplate } from './modern-ats'

export type ResumePdfTemplateRenderer = (
  presentation: ResumePresentation,
  typography: ResumePdfTypography,
) => ReactNode

export const resumePdfTemplates = {
  'classic-ats': (presentation, typography) =>
    createElement(ClassicAtsTemplate, { presentation, typography }),
  'modern-ats': (presentation, typography) =>
    createElement(ModernAtsTemplate, { presentation, typography }),
  'chinese-clean': (presentation, typography) =>
    createElement(ChineseCleanTemplate, { presentation, typography }),
} satisfies Record<ResumeTemplate, ResumePdfTemplateRenderer>

export function getResumePdfTemplate(template: ResumeTemplate) {
  if (!Object.hasOwn(resumePdfTemplates, template)) {
    throw new Error('Unsupported resume PDF template.')
  }

  return resumePdfTemplates[template]
}
