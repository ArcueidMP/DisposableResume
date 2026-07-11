import { z } from 'zod'

export const resumeLimits = {
  basics: {
    email: 160,
    links: 8,
    location: 120,
    name: 120,
    phone: 40,
  },
  education: {
    credential: 140,
    detail: 180,
    details: 6,
    items: 8,
    school: 120,
  },
  id: 128,
  link: {
    label: 80,
    url: 200,
  },
  project: {
    description: 240,
    highlight: 180,
    highlights: 8,
    items: 12,
    name: 120,
  },
  skill: {
    item: 60,
    items: 60,
  },
  work: {
    highlight: 180,
    highlights: 8,
    items: 12,
    organization: 120,
    role: 120,
  },
  shared: {
    date: 40,
    location: 120,
  },
} as const

const draftText = (max: number) => z.string().trim().max(max)

const draftEmail = z
  .string()
  .trim()
  .max(resumeLimits.basics.email)
  .refine(
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

export const resumeLinkSchema = z.strictObject({
  label: z.string().trim().min(1).max(resumeLimits.link.label),
  url: z.string().trim().url().max(resumeLimits.link.url),
})

export const resumeBasicsSchema = z.strictObject({
  name: draftText(resumeLimits.basics.name),
  email: draftEmail,
  phone: draftText(resumeLimits.basics.phone),
  location: draftText(resumeLimits.basics.location),
  links: z.array(resumeLinkSchema).max(resumeLimits.basics.links),
})

export const resumeWorkSchema = z.strictObject({
  id: z.string().trim().min(1).max(resumeLimits.id),
  role: draftText(resumeLimits.work.role),
  organization: draftText(resumeLimits.work.organization),
  location: draftText(resumeLimits.shared.location),
  startDate: draftText(resumeLimits.shared.date),
  endDate: draftText(resumeLimits.shared.date),
  highlights: z
    .array(draftText(resumeLimits.work.highlight))
    .max(resumeLimits.work.highlights),
})

export const resumeEducationSchema = z.strictObject({
  id: z.string().trim().min(1).max(resumeLimits.id),
  school: draftText(resumeLimits.education.school),
  credential: draftText(resumeLimits.education.credential),
  location: draftText(resumeLimits.shared.location),
  startDate: draftText(resumeLimits.shared.date),
  endDate: draftText(resumeLimits.shared.date),
  details: z
    .array(draftText(resumeLimits.education.detail))
    .max(resumeLimits.education.details),
})

export const resumeProjectSchema = z.strictObject({
  id: z.string().trim().min(1).max(resumeLimits.id),
  name: draftText(resumeLimits.project.name),
  description: draftText(resumeLimits.project.description),
  highlights: z
    .array(draftText(resumeLimits.project.highlight))
    .max(resumeLimits.project.highlights),
})

type ResumeEntry = { id: string }

function addDuplicateIdIssues(
  entries: ResumeEntry[],
  section: 'education' | 'projects' | 'work',
  context: z.RefinementCtx,
) {
  const seenIds = new Set<string>()

  entries.forEach((entry, index) => {
    if (seenIds.has(entry.id)) {
      context.addIssue({
        code: 'custom',
        message: `${section} entry IDs must be unique.`,
        path: [section, index, 'id'],
      })
      return
    }

    seenIds.add(entry.id)
  })
}

export const resumeSchema = z
  .strictObject({
    template: resumeTemplateSchema,
    basics: resumeBasicsSchema,
    work: z.array(resumeWorkSchema).max(resumeLimits.work.items),
    education: z.array(resumeEducationSchema).max(resumeLimits.education.items),
    projects: z.array(resumeProjectSchema).max(resumeLimits.project.items),
    skills: z
      .array(z.string().trim().min(1).max(resumeLimits.skill.item))
      .max(resumeLimits.skill.items),
  })
  .superRefine((resume, context) => {
    addDuplicateIdIssues(resume.work, 'work', context)
    addDuplicateIdIssues(resume.education, 'education', context)
    addDuplicateIdIssues(resume.projects, 'projects', context)
  })
  .brand<'ValidatedResume'>()
