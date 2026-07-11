import { Document } from '@react-pdf/renderer'
import { createResumePresentation } from '../resume/presentation'
import type { Resume } from '../resume/types'
import { getResumePdfTemplate } from './templates'

export function ResumePdfDocument({ resume }: { resume: Resume }) {
  const presentation = createResumePresentation(resume)
  const renderTemplate = getResumePdfTemplate(presentation.template)

  return <Document>{renderTemplate(presentation)}</Document>
}
