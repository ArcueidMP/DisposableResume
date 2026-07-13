import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDefaultResume,
  createEmptyEducation,
  createEmptyProject,
  createEmptyResume,
  createEmptyWork,
} from '../resume/defaults'
import type { ResumeDraft } from '../resume/types'
import { validateResume } from '../resume/validation'
import {
  moveArrayItem,
  useResumeStore,
  type MoveDirection,
} from './resume-store'

function createReorderFixture(): ResumeDraft {
  const resume = createDefaultResume()
  const firstWork = createEmptyWork('work-first')
  const secondWork = createEmptyWork('work-second')
  const firstEducation = createEmptyEducation('education-first')
  const secondEducation = createEmptyEducation('education-second')
  const firstProject = createEmptyProject('project-first')
  const secondProject = createEmptyProject('project-second')

  resume.basics.links = [
    { label: 'First', url: 'https://first.example.invalid' },
    { label: '', url: '' },
    { label: 'Same', url: 'https://same.example.invalid' },
  ]
  resume.skills = ['Same', '', 'Same']
  firstWork.highlights = ['Same', '', 'Same']
  firstEducation.details = ['Same', '', 'Same']
  firstProject.highlights = ['Same', '', 'Same']
  resume.work = [firstWork, secondWork]
  resume.education = [firstEducation, secondEducation]
  resume.projects = [firstProject, secondProject]

  return resume
}

function loadReorderFixture() {
  useResumeStore.setState({ resume: createReorderFixture() })
}

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

  it.each([
    {
      expected: ['First', 'Same', ''],
      move: () => useResumeStore.getState().moveLink(2, 'up'),
      name: 'links',
      read: () =>
        useResumeStore.getState().resume.basics.links.map((link) => link.label),
    },
    {
      expected: ['Same', 'Same', ''],
      move: () => useResumeStore.getState().moveSkill(2, 'up'),
      name: 'skills',
      read: () => useResumeStore.getState().resume.skills,
    },
    {
      expected: ['work-second', 'work-first'],
      move: () => useResumeStore.getState().moveWork('work-second', 'up'),
      name: 'work entries',
      read: () => useResumeStore.getState().resume.work.map((item) => item.id),
    },
    {
      expected: ['Same', 'Same', ''],
      move: () =>
        useResumeStore.getState().moveWorkHighlight('work-first', 2, 'up'),
      name: 'work highlights',
      read: () => useResumeStore.getState().resume.work[0]?.highlights,
    },
    {
      expected: ['education-second', 'education-first'],
      move: () =>
        useResumeStore.getState().moveEducation('education-second', 'up'),
      name: 'education entries',
      read: () =>
        useResumeStore.getState().resume.education.map((item) => item.id),
    },
    {
      expected: ['Same', 'Same', ''],
      move: () =>
        useResumeStore
          .getState()
          .moveEducationDetail('education-first', 2, 'up'),
      name: 'education details',
      read: () => useResumeStore.getState().resume.education[0]?.details,
    },
    {
      expected: ['project-second', 'project-first'],
      move: () => useResumeStore.getState().moveProject('project-second', 'up'),
      name: 'project entries',
      read: () =>
        useResumeStore.getState().resume.projects.map((item) => item.id),
    },
    {
      expected: ['Same', 'Same', ''],
      move: () =>
        useResumeStore
          .getState()
          .moveProjectHighlight('project-first', 2, 'up'),
      name: 'project highlights',
      read: () => useResumeStore.getState().resume.projects[0]?.highlights,
    },
  ])(
    'moves adjacent $name without value-based matching',
    ({ expected, move, read }) => {
      loadReorderFixture()

      move()

      expect(read()).toEqual(expected)
    },
  )

  it.each([
    {
      move: () => useResumeStore.getState().moveLink(0, 'up'),
      name: 'link at its boundary',
    },
    {
      move: () => useResumeStore.getState().moveSkill(3, 'down'),
      name: 'skill at an invalid index',
    },
    {
      move: () => useResumeStore.getState().moveWork('missing', 'down'),
      name: 'missing work entry',
    },
    {
      move: () =>
        useResumeStore.getState().moveWorkHighlight('missing', 0, 'down'),
      name: 'highlight in a missing work entry',
    },
    {
      move: () =>
        useResumeStore.getState().moveEducation('education-first', 'up'),
      name: 'education entry at its boundary',
    },
    {
      move: () =>
        useResumeStore
          .getState()
          .moveEducationDetail('education-first', 99, 'down'),
      name: 'education detail at an invalid index',
    },
    {
      move: () =>
        useResumeStore.getState().moveProject('project-second', 'down'),
      name: 'project entry at its boundary',
    },
    {
      move: () =>
        useResumeStore
          .getState()
          .moveProjectHighlight('project-first', 0, 'up'),
      name: 'project highlight at its boundary',
    },
  ])('preserves the store reference for a no-op $name', ({ move }) => {
    loadReorderFixture()
    const state = useResumeStore.getState()

    move()

    expect(useResumeStore.getState()).toBe(state)
  })

  it('only copies the nested path changed by a valid move', () => {
    loadReorderFixture()
    const before = useResumeStore.getState().resume
    const untouchedWork = before.work[1]

    useResumeStore.getState().moveWorkHighlight('work-first', 2, 'up')

    const after = useResumeStore.getState().resume
    expect(after).not.toBe(before)
    expect(after.work).not.toBe(before.work)
    expect(after.work[0]).not.toBe(before.work[0])
    expect(after.work[1]).toBe(untouchedWork)
    expect(after.education).toBe(before.education)
    expect(after.projects).toBe(before.projects)
  })

  it.each([
    { direction: 'up', index: 0 },
    { direction: 'down', index: 2 },
    { direction: 'down', index: -1 },
    { direction: 'up', index: 1.5 },
  ] satisfies { direction: MoveDirection; index: number }[])(
    'keeps the source array for an invalid $direction move at $index',
    ({ direction, index }) => {
      const items = ['first', 'second']

      expect(moveArrayItem(items, index, direction)).toBe(items)
    },
  )
})
