import { pdf } from '@react-pdf/renderer'
import { downloadBlob } from '../browser/download'
import { createResumePresentation } from '../resume/presentation'
import type { Resume, ResumeDraft } from '../resume/types'
import { createPdfFilename } from './filenames'
import { resolveResumePdfTypography } from './fonts/resume-pdf-typography'
import { ResumePdfDocument } from './ResumePdfDocument'

/**
 * Renders the resume through the template pipeline that PDF export uses. It
 * accepts an unvalidated draft so the live preview can show every edit as
 * typed; export validates first and passes the resulting Resume.
 */
export async function createResumePdfBlob(resume: ResumeDraft) {
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
