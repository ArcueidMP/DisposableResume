export const resumeSections = [
  'Basic info',
  'Work experience',
  'Education',
  'Projects',
  'Skills',
] as const

export type ResumeSection = (typeof resumeSections)[number]
