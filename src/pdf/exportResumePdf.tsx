import { pdf } from '@react-pdf/renderer'
import { downloadBlob } from '../browser/download'
import type { Resume } from '../resume/types'
import { createPdfFilename } from './filenames'
import { ResumePdfDocument } from './ResumePdfDocument'

export async function createResumePdfBlob(resume: Resume) {
  if (resume.template === 'chinese-clean') {
    const { registerChineseCleanFonts } =
      await import('./fonts/register-chinese-clean-fonts')

    registerChineseCleanFonts()
  }

  return pdf(<ResumePdfDocument resume={resume} />).toBlob()
}

export async function exportResumePdf(resume: Resume) {
  const blob = await createResumePdfBlob(resume)

  downloadBlob(blob, createPdfFilename())
}
