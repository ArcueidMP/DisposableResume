import { pdf } from '@react-pdf/renderer'
import { downloadBlob } from '../browser/download'
import { createResumePresentation } from '../resume/presentation'
import type { Resume } from '../resume/types'
import { createPdfFilename } from './filenames'
import { resolveResumePdfTypography } from './fonts/resume-pdf-typography'
import { ResumePdfDocument } from './ResumePdfDocument'

export async function createResumePdfBlob(resume: Resume) {
  const presentation = createResumePresentation(resume)
  const typography = resolveResumePdfTypography(presentation)

  if (typography.requiresChineseCleanFonts) {
    const { registerChineseCleanFonts } =
      await import('./fonts/register-chinese-clean-fonts')

    registerChineseCleanFonts()
  }

  return pdf(
    <ResumePdfDocument presentation={presentation} typography={typography} />,
  ).toBlob()
}

export async function exportResumePdf(resume: Resume) {
  const blob = await createResumePdfBlob(resume)

  downloadBlob(blob, createPdfFilename())
}
