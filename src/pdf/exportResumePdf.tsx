import { pdf } from '@react-pdf/renderer'
import { downloadBlob } from '../browser/download'
import type { Resume } from '../resume/types'
import { createPdfFilename } from './filenames'
import { ResumePdfDocument } from './ResumePdfDocument'

export async function exportResumePdf(resume: Resume) {
  const blob = await pdf(<ResumePdfDocument resume={resume} />).toBlob()

  downloadBlob(blob, createPdfFilename())
}
