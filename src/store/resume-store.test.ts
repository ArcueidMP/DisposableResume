import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultResume, createEmptyResume } from '../resume/defaults'
import { validateResume } from '../resume/validation'
import { useResumeStore } from './resume-store'

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore.getState().resetToDefaults()
  })

  it('resets edited resume state to the fake defaults', () => {
    const { resetToDefaults, selectTemplate, updateBasics, updateSkills } =
      useResumeStore.getState()

    updateBasics({ name: 'Edited Fixture Person' })
    updateSkills(['Edited Skill'])
    selectTemplate('modern-ats')
    resetToDefaults()

    expect(useResumeStore.getState().resume).toEqual(createDefaultResume())
  })

  it('adds, updates, and removes work, education, and project entries', () => {
    const workId = useResumeStore.getState().addWork()
    useResumeStore.getState().updateWork(workId, {
      role: 'Fixture Builder',
      organization: 'Example Fixture Studio',
      highlights: ['Built local-only editing coverage.'],
    })

    expect(
      useResumeStore.getState().resume.work.find((item) => item.id === workId),
    ).toMatchObject({
      role: 'Fixture Builder',
      organization: 'Example Fixture Studio',
      highlights: ['Built local-only editing coverage.'],
    })

    useResumeStore.getState().removeWork(workId)
    expect(
      useResumeStore.getState().resume.work.some((item) => item.id === workId),
    ).toBe(false)

    const educationId = useResumeStore.getState().addEducation()
    useResumeStore.getState().updateEducation(educationId, {
      school: 'Example Fixture Institute',
      credential: 'Fixture Credential',
      details: ['Kept fixture data fake.'],
    })

    expect(
      useResumeStore
        .getState()
        .resume.education.find((item) => item.id === educationId),
    ).toMatchObject({
      school: 'Example Fixture Institute',
      credential: 'Fixture Credential',
      details: ['Kept fixture data fake.'],
    })

    useResumeStore.getState().removeEducation(educationId)
    expect(
      useResumeStore
        .getState()
        .resume.education.some((item) => item.id === educationId),
    ).toBe(false)

    const projectId = useResumeStore.getState().addProject()
    useResumeStore.getState().updateProject(projectId, {
      name: 'Fixture Project',
      description: 'A fake project used for local tests.',
      highlights: ['Validated repeated-section store updates.'],
    })

    expect(
      useResumeStore
        .getState()
        .resume.projects.find((item) => item.id === projectId),
    ).toMatchObject({
      name: 'Fixture Project',
      description: 'A fake project used for local tests.',
      highlights: ['Validated repeated-section store updates.'],
    })

    useResumeStore.getState().removeProject(projectId)
    expect(
      useResumeStore
        .getState()
        .resume.projects.some((item) => item.id === projectId),
    ).toBe(false)
  })

  it('clears edited data to an empty valid local resume', () => {
    useResumeStore.getState().updateBasics({ name: 'Edited Fixture Person' })
    useResumeStore.getState().updateSkills(['Edited Skill'])
    useResumeStore.getState().clearResume()

    expect(useResumeStore.getState().resume).toEqual(createEmptyResume())
    expect(validateResume(useResumeStore.getState().resume).success).toBe(true)
  })
})
