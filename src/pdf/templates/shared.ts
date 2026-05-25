import type {
  ResumeBasics,
  ResumeEducation,
  ResumeProject,
  ResumeWork,
} from '../../resume/types'

export function compactText(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

export function formatContactLine(basics: ResumeBasics) {
  return compactText([basics.email, basics.phone, basics.location]).join(' | ')
}

export function formatDateLocationLine(
  item: Pick<ResumeEducation | ResumeWork, 'endDate' | 'location' | 'startDate'>,
) {
  return compactText([
    compactText([item.startDate, item.endDate]).join(' - '),
    item.location,
  ]).join(' | ')
}

export function hasEducationContent(item: ResumeEducation) {
  return (
    compactText([
      item.school,
      item.credential,
      item.location,
      item.startDate,
      item.endDate,
      ...item.details,
    ]).length > 0
  )
}

export function hasProjectContent(item: ResumeProject) {
  return (
    compactText([item.name, item.description, ...item.highlights]).length > 0
  )
}

export function hasWorkContent(item: ResumeWork) {
  return (
    compactText([
      item.role,
      item.organization,
      item.location,
      item.startDate,
      item.endDate,
      ...item.highlights,
    ]).length > 0
  )
}
