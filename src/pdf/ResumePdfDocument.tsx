import { Document } from '@react-pdf/renderer'
import type { ResumePresentation } from '../resume/presentation'
import type { ResumePdfTypography } from './fonts/resume-pdf-typography'
import { getResumePdfTemplate } from './templates'

export function ResumePdfDocument({
  presentation,
  typography,
}: {
  presentation: ResumePresentation
  typography: ResumePdfTypography
}) {
  const renderTemplate = getResumePdfTemplate(presentation.template)

  return <Document>{renderTemplate(presentation, typography)}</Document>
}
