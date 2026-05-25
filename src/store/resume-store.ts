import { create } from 'zustand'
import {
  createDefaultResume,
  createEmptyEducation,
  createEmptyProject,
  createEmptyResume,
  createEmptyWork,
} from '../resume/defaults'
import type {
  Resume,
  ResumeBasics,
  ResumeEducation,
  ResumeProject,
  ResumeTemplate,
  ResumeWork,
} from '../resume/types'

type WorkUpdate = Partial<Omit<ResumeWork, 'id'>>
type EducationUpdate = Partial<Omit<ResumeEducation, 'id'>>
type ProjectUpdate = Partial<Omit<ResumeProject, 'id'>>

type ResumeStore = {
  resume: Resume
  replaceResume: (resume: Resume) => void
  updateBasics: (basics: Partial<ResumeBasics>) => void
  updateSkills: (skills: string[]) => void
  addWork: () => string
  updateWork: (id: string, work: WorkUpdate) => void
  removeWork: (id: string) => void
  addEducation: () => string
  updateEducation: (id: string, education: EducationUpdate) => void
  removeEducation: (id: string) => void
  addProject: () => string
  updateProject: (id: string, project: ProjectUpdate) => void
  removeProject: (id: string) => void
  selectTemplate: (template: ResumeTemplate) => void
  clearResume: () => void
  resetToDefaults: () => void
}

let draftIdCounter = 0

function createDraftId(prefix: string) {
  draftIdCounter += 1

  return `${prefix}-${Date.now().toString(36)}-${draftIdCounter}`
}

export const useResumeStore = create<ResumeStore>()((set) => ({
  resume: createDefaultResume(),
  replaceResume: (resume) =>
    set({
      resume: structuredClone(resume),
    }),
  updateBasics: (basics) =>
    set((state) => ({
      resume: {
        ...state.resume,
        basics: {
          ...state.resume.basics,
          ...basics,
          links:
            basics.links === undefined
              ? state.resume.basics.links
              : basics.links.map((link) => ({ ...link })),
        },
      },
    })),
  updateSkills: (skills) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: [...skills],
      },
    })),
  addWork: () => {
    const work = createEmptyWork(createDraftId('work'))

    set((state) => ({
      resume: {
        ...state.resume,
        work: [...state.resume.work, work],
      },
    }))

    return work.id
  },
  updateWork: (id, work) =>
    set((state) => ({
      resume: {
        ...state.resume,
        work: state.resume.work.map((item) =>
          item.id === id
            ? {
                ...item,
                ...work,
                highlights:
                  work.highlights === undefined
                    ? item.highlights
                    : [...work.highlights],
              }
            : item,
        ),
      },
    })),
  removeWork: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        work: state.resume.work.filter((item) => item.id !== id),
      },
    })),
  addEducation: () => {
    const education = createEmptyEducation(createDraftId('education'))

    set((state) => ({
      resume: {
        ...state.resume,
        education: [...state.resume.education, education],
      },
    }))

    return education.id
  },
  updateEducation: (id, education) =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: state.resume.education.map((item) =>
          item.id === id
            ? {
                ...item,
                ...education,
                details:
                  education.details === undefined
                    ? item.details
                    : [...education.details],
              }
            : item,
        ),
      },
    })),
  removeEducation: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: state.resume.education.filter((item) => item.id !== id),
      },
    })),
  addProject: () => {
    const project = createEmptyProject(createDraftId('project'))

    set((state) => ({
      resume: {
        ...state.resume,
        projects: [...state.resume.projects, project],
      },
    }))

    return project.id
  },
  updateProject: (id, project) =>
    set((state) => ({
      resume: {
        ...state.resume,
        projects: state.resume.projects.map((item) =>
          item.id === id
            ? {
                ...item,
                ...project,
                highlights:
                  project.highlights === undefined
                    ? item.highlights
                    : [...project.highlights],
              }
            : item,
        ),
      },
    })),
  removeProject: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        projects: state.resume.projects.filter((item) => item.id !== id),
      },
    })),
  selectTemplate: (template) =>
    set((state) => ({
      resume: {
        ...state.resume,
        template,
      },
    })),
  clearResume: () =>
    set({
      resume: createEmptyResume(),
    }),
  resetToDefaults: () =>
    set({
      resume: createDefaultResume(),
    }),
}))
