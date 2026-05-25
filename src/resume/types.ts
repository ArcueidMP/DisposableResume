import type { z } from 'zod'
import type {
  resumeBasicsSchema,
  resumeEducationSchema,
  resumeLinkSchema,
  resumeProjectSchema,
  resumeSchema,
  resumeTemplateSchema,
  resumeWorkSchema,
} from './schema'

export type ResumeTemplate = z.infer<typeof resumeTemplateSchema>
export type ResumeLink = z.infer<typeof resumeLinkSchema>
export type ResumeBasics = z.infer<typeof resumeBasicsSchema>
export type ResumeWork = z.infer<typeof resumeWorkSchema>
export type ResumeEducation = z.infer<typeof resumeEducationSchema>
export type ResumeProject = z.infer<typeof resumeProjectSchema>
export type Resume = z.infer<typeof resumeSchema>
