import { z } from 'zod'

const draftText = (max: number) => z.string().trim().max(max)

const draftEmail = z.string().trim().max(160).refine(
  (value) => value === '' || z.string().email().safeParse(value).success,
  'Enter a valid email address.',
)

export const resumeTemplateSchema = z.enum([
  'classic-ats',
  'modern-ats',
  'chinese-clean',
])

export const resumeTemplateOptions = [
  { id: 'classic-ats', label: 'Classic ATS' },
  { id: 'modern-ats', label: 'Modern ATS' },
  { id: 'chinese-clean', label: 'Chinese Clean' },
] as const

export const resumeLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().url().max(200),
})

export const resumeBasicsSchema = z.object({
  name: draftText(120),
  email: draftEmail,
  phone: draftText(40),
  location: draftText(120),
  links: z.array(resumeLinkSchema).max(8),
})

export const resumeWorkSchema = z.object({
  id: z.string().trim().min(1),
  role: draftText(120),
  organization: draftText(120),
  location: draftText(120),
  startDate: draftText(40),
  endDate: draftText(40),
  highlights: z.array(draftText(180)).max(8),
})

export const resumeEducationSchema = z.object({
  id: z.string().trim().min(1),
  school: draftText(120),
  credential: draftText(140),
  location: draftText(120),
  startDate: draftText(40),
  endDate: draftText(40),
  details: z.array(draftText(180)).max(6),
})

export const resumeProjectSchema = z.object({
  id: z.string().trim().min(1),
  name: draftText(120),
  description: draftText(240),
  highlights: z.array(draftText(180)).max(8),
})

export const resumeSchema = z.object({
  template: resumeTemplateSchema,
  basics: resumeBasicsSchema,
  work: z.array(resumeWorkSchema).max(12),
  education: z.array(resumeEducationSchema).max(8),
  projects: z.array(resumeProjectSchema).max(12),
  skills: z.array(z.string().trim().min(1).max(60)).max(60),
})
