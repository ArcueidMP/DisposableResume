import { describe, expect, it } from 'vitest'
import { createEmptyResume } from './defaults'
import { createResumePresentation } from './presentation'

describe('createResumePresentation', () => {
  it('normalizes display text, filters empty content, and fixes section order', () => {
    const draft = createEmptyResume()

    draft.template = 'modern-ats'
    draft.basics = {
      name: '  Sample Person  ',
      email: ' sample.person@example.invalid ',
      phone: '   ',
      location: ' Example City, ZZ ',
      links: [
        { label: ' Portfolio ', url: ' https://example.invalid ' },
        { label: ' ', url: ' ' },
      ],
    }
    draft.skills = [' TypeScript ', ' ', 'Privacy UX']
    draft.work = [
      {
        id: 'work-empty',
        role: ' ',
        organization: '',
        location: ' ',
        startDate: '',
        endDate: '',
        highlights: [' '],
      },
      {
        id: 'work-example',
        role: ' Builder ',
        organization: ' Example Workshop ',
        location: ' Remote ',
        startDate: ' 2025 ',
        endDate: ' Present ',
        highlights: [' Shipped a browser-only fixture. ', ' '],
      },
    ]
    draft.education = [
      {
        id: 'education-example',
        school: ' Example Institute ',
        credential: ' ',
        location: '',
        startDate: '',
        endDate: ' 2024 ',
        details: [' Completed a fictional course. ', ''],
      },
    ]
    draft.projects = [
      {
        id: 'project-empty',
        name: '',
        description: ' ',
        highlights: [],
      },
      {
        id: 'project-example',
        name: ' Resume Fixture ',
        description: ' Client-only sample. ',
        highlights: [' No remote storage. ', ' '],
      },
    ]

    expect(createResumePresentation(draft)).toEqual({
      template: 'modern-ats',
      header: {
        name: 'Sample Person',
        contact: 'sample.person@example.invalid | Example City, ZZ',
        links: ['Portfolio: https://example.invalid'],
      },
      sections: [
        { kind: 'skills', items: ['TypeScript', 'Privacy UX'] },
        {
          kind: 'work',
          items: [
            {
              id: 'work-example',
              role: 'Builder',
              organization: 'Example Workshop',
              meta: '2025 - Present | Remote',
              highlights: ['Shipped a browser-only fixture.'],
            },
          ],
        },
        {
          kind: 'education',
          items: [
            {
              id: 'education-example',
              school: 'Example Institute',
              credential: '',
              meta: '2024',
              details: ['Completed a fictional course.'],
            },
          ],
        },
        {
          kind: 'projects',
          items: [
            {
              id: 'project-example',
              name: 'Resume Fixture',
              description: 'Client-only sample.',
              highlights: ['No remote storage.'],
            },
          ],
        },
      ],
    })
  })

  it('does not mutate the editor draft', () => {
    const draft = createEmptyResume()

    draft.skills = ['  TypeScript  ', ' ']
    const original = structuredClone(draft)

    createResumePresentation(draft)

    expect(draft).toEqual(original)
  })
})
