import type { Resume, ResumeEducation, ResumeProject, ResumeWork } from './types'

export const defaultResume: Resume = {
  template: 'classic-ats',
  basics: {
    name: 'Sample Candidate',
    email: 'sample.candidate@example.invalid',
    phone: '+0 000 000 0000',
    location: 'Example City, ZZ',
    links: [],
  },
  work: [
    {
      id: 'work-example-1',
      role: 'Product Builder',
      organization: 'Example Placeholder Workshop',
      location: 'Remote Sample Lab',
      startDate: '2024',
      endDate: 'Present',
      highlights: [
        'Built privacy-minded browser tools with client-only data handling.',
        'Shaped readable interfaces for editing structured candidate details.',
      ],
    },
  ],
  education: [
    {
      id: 'education-example-1',
      school: 'Sample Learning Institute',
      credential: 'Certificate in Practical Interfaces',
      location: 'Example City, ZZ',
      startDate: '2022',
      endDate: '2023',
      details: ['Completed a fake-only fixture program for product builders.'],
    },
  ],
  projects: [
    {
      id: 'project-example-1',
      name: 'Browser Resume Fixture',
      description:
        'A sample client-only resume workflow used for development fixtures.',
      highlights: [
        'Modeled basics, skills, work, education, and project sections.',
        'Kept fixture data fictional and suitable for tests.',
      ],
    },
  ],
  skills: ['TypeScript', 'React', 'Privacy UX'],
}

export function createDefaultResume(): Resume {
  return structuredClone(defaultResume)
}

export function createEmptyResume(): Resume {
  return {
    template: 'classic-ats',
    basics: {
      name: '',
      email: '',
      phone: '',
      location: '',
      links: [],
    },
    work: [],
    education: [],
    projects: [],
    skills: [],
  }
}

export function createEmptyWork(id: string): ResumeWork {
  return {
    id,
    role: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: '',
    highlights: [],
  }
}

export function createEmptyEducation(id: string): ResumeEducation {
  return {
    id,
    school: '',
    credential: '',
    location: '',
    startDate: '',
    endDate: '',
    details: [],
  }
}

export function createEmptyProject(id: string): ResumeProject {
  return {
    id,
    name: '',
    description: '',
    highlights: [],
  }
}
