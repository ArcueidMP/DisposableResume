import type { ResumeDraft, ResumeTemplate } from './types'

export type PresentationWork = {
  id: string
  role: string
  organization: string
  meta: string
  highlights: readonly string[]
}

export type PresentationEducation = {
  id: string
  school: string
  credential: string
  meta: string
  details: readonly string[]
}

export type PresentationProject = {
  id: string
  name: string
  description: string
  highlights: readonly string[]
}

export type PresentationSkillsSection = {
  kind: 'skills'
  items: readonly string[]
}

export type PresentationWorkSection = {
  kind: 'work'
  items: readonly PresentationWork[]
}

export type PresentationEducationSection = {
  kind: 'education'
  items: readonly PresentationEducation[]
}

export type PresentationProjectsSection = {
  kind: 'projects'
  items: readonly PresentationProject[]
}

export type ResumePresentationSection =
  | PresentationSkillsSection
  | PresentationWorkSection
  | PresentationEducationSection
  | PresentationProjectsSection

export type ResumePresentation = {
  template: ResumeTemplate
  header: {
    name: string
    contact: string
    links: readonly string[]
  }
  sections: readonly [
    PresentationSkillsSection,
    PresentationWorkSection,
    PresentationEducationSection,
    PresentationProjectsSection,
  ]
}

function compactText(values: readonly string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

function formatMeta(startDate: string, endDate: string, location: string) {
  const dates = compactText([startDate, endDate]).join(' - ')

  return compactText([dates, location]).join(' | ')
}

export function createResumePresentation(
  resume: ResumeDraft,
): ResumePresentation {
  const skills = compactText(resume.skills)
  const work = resume.work
    .map((item) => ({
      id: item.id,
      role: item.role.trim(),
      organization: item.organization.trim(),
      meta: formatMeta(item.startDate, item.endDate, item.location),
      highlights: compactText(item.highlights),
    }))
    .filter(
      (item) =>
        compactText([
          item.role,
          item.organization,
          item.meta,
          ...item.highlights,
        ]).length > 0,
    )
  const education = resume.education
    .map((item) => ({
      id: item.id,
      school: item.school.trim(),
      credential: item.credential.trim(),
      meta: formatMeta(item.startDate, item.endDate, item.location),
      details: compactText(item.details),
    }))
    .filter(
      (item) =>
        compactText([item.school, item.credential, item.meta, ...item.details])
          .length > 0,
    )
  const projects = resume.projects
    .map((item) => ({
      id: item.id,
      name: item.name.trim(),
      description: item.description.trim(),
      highlights: compactText(item.highlights),
    }))
    .filter(
      (item) =>
        compactText([item.name, item.description, ...item.highlights]).length >
        0,
    )

  return {
    template: resume.template,
    header: {
      name: resume.basics.name.trim(),
      contact: compactText([
        resume.basics.email,
        resume.basics.phone,
        resume.basics.location,
      ]).join(' | '),
      links: resume.basics.links
        .map((link) => compactText([link.label, link.url]).join(': '))
        .filter(Boolean),
    },
    sections: [
      { kind: 'skills', items: skills },
      { kind: 'work', items: work },
      { kind: 'education', items: education },
      { kind: 'projects', items: projects },
    ],
  }
}
