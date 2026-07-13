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
  ResumeDraft,
  ResumeEducation,
  ResumeProject,
  ResumeTemplate,
  ResumeWork,
} from '../resume/types'

type WorkUpdate = Partial<Omit<ResumeWork, 'id'>>
type EducationUpdate = Partial<Omit<ResumeEducation, 'id'>>
type ProjectUpdate = Partial<Omit<ResumeProject, 'id'>>

export type MoveDirection = 'up' | 'down'

type ResumeStore = {
  resume: ResumeDraft
  replaceResume: (resume: Resume) => void
  updateBasics: (basics: Partial<ResumeBasics>) => void
  updateSkills: (skills: string[]) => void
  moveLink: (index: number, direction: MoveDirection) => void
  moveSkill: (index: number, direction: MoveDirection) => void
  addWork: () => string
  updateWork: (id: string, work: WorkUpdate) => void
  removeWork: (id: string) => void
  moveWork: (id: string, direction: MoveDirection) => void
  moveWorkHighlight: (
    workId: string,
    index: number,
    direction: MoveDirection,
  ) => void
  addEducation: () => string
  updateEducation: (id: string, education: EducationUpdate) => void
  removeEducation: (id: string) => void
  moveEducation: (id: string, direction: MoveDirection) => void
  moveEducationDetail: (
    educationId: string,
    index: number,
    direction: MoveDirection,
  ) => void
  addProject: () => string
  updateProject: (id: string, project: ProjectUpdate) => void
  removeProject: (id: string) => void
  moveProject: (id: string, direction: MoveDirection) => void
  moveProjectHighlight: (
    projectId: string,
    index: number,
    direction: MoveDirection,
  ) => void
  selectTemplate: (template: ResumeTemplate) => void
  clearResume: () => void
  resetToDefaults: () => void
}

let draftIdCounter = 0

function createDraftId(prefix: string) {
  draftIdCounter += 1

  return `${prefix}-${Date.now().toString(36)}-${draftIdCounter}`
}

export function moveArrayItem<T>(
  items: T[],
  index: number,
  direction: MoveDirection,
): T[] {
  const destination = direction === 'up' ? index - 1 : index + 1

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= items.length ||
    destination < 0 ||
    destination >= items.length
  ) {
    return items
  }

  const movedItems = [...items]
  const movedItem = movedItems[index] as T
  movedItems[index] = movedItems[destination] as T
  movedItems[destination] = movedItem

  return movedItems
}

function moveArrayItemById<T extends { id: string }>(
  items: T[],
  id: string,
  direction: MoveDirection,
) {
  return moveArrayItem(
    items,
    items.findIndex((item) => item.id === id),
    direction,
  )
}

function moveNestedStringItem<T extends { id: string }>(
  entries: T[],
  entryId: string,
  index: number,
  direction: MoveDirection,
  readItems: (entry: T) => string[],
  writeItems: (entry: T, items: string[]) => T,
) {
  const entryIndex = entries.findIndex((entry) => entry.id === entryId)
  const entry = entries[entryIndex]

  if (entry === undefined) {
    return entries
  }

  const currentItems = readItems(entry)
  const movedItems = moveArrayItem(currentItems, index, direction)

  if (movedItems === currentItems) {
    return entries
  }

  const movedEntries = [...entries]
  movedEntries[entryIndex] = writeItems(entry, movedItems)

  return movedEntries
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
  moveLink: (index, direction) =>
    set((state) => {
      const links = moveArrayItem(state.resume.basics.links, index, direction)

      if (links === state.resume.basics.links) {
        return state
      }

      return {
        resume: {
          ...state.resume,
          basics: {
            ...state.resume.basics,
            links,
          },
        },
      }
    }),
  moveSkill: (index, direction) =>
    set((state) => {
      const skills = moveArrayItem(state.resume.skills, index, direction)

      if (skills === state.resume.skills) {
        return state
      }

      return {
        resume: {
          ...state.resume,
          skills,
        },
      }
    }),
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
  moveWork: (id, direction) =>
    set((state) => {
      const work = moveArrayItemById(state.resume.work, id, direction)

      if (work === state.resume.work) {
        return state
      }

      return { resume: { ...state.resume, work } }
    }),
  moveWorkHighlight: (workId, index, direction) =>
    set((state) => {
      const work = moveNestedStringItem(
        state.resume.work,
        workId,
        index,
        direction,
        (item) => item.highlights,
        (item, highlights) => ({ ...item, highlights }),
      )

      if (work === state.resume.work) {
        return state
      }

      return { resume: { ...state.resume, work } }
    }),
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
  moveEducation: (id, direction) =>
    set((state) => {
      const education = moveArrayItemById(state.resume.education, id, direction)

      if (education === state.resume.education) {
        return state
      }

      return { resume: { ...state.resume, education } }
    }),
  moveEducationDetail: (educationId, index, direction) =>
    set((state) => {
      const education = moveNestedStringItem(
        state.resume.education,
        educationId,
        index,
        direction,
        (item) => item.details,
        (item, details) => ({ ...item, details }),
      )

      if (education === state.resume.education) {
        return state
      }

      return { resume: { ...state.resume, education } }
    }),
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
  moveProject: (id, direction) =>
    set((state) => {
      const projects = moveArrayItemById(state.resume.projects, id, direction)

      if (projects === state.resume.projects) {
        return state
      }

      return { resume: { ...state.resume, projects } }
    }),
  moveProjectHighlight: (projectId, index, direction) =>
    set((state) => {
      const projects = moveNestedStringItem(
        state.resume.projects,
        projectId,
        index,
        direction,
        (item) => item.highlights,
        (item, highlights) => ({ ...item, highlights }),
      )

      if (projects === state.resume.projects) {
        return state
      }

      return { resume: { ...state.resume, projects } }
    }),
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
