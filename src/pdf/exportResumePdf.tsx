import { pdf } from '@react-pdf/renderer'
import type { Resume } from '../resume/types'
import { downloadBlob } from './download'
import { createPdfFilename } from './filenames'
import { ResumePdfDocument } from './ResumePdfDocument'

export async function exportResumePdf(resume: Resume) {
  const blob = await pdf(<ResumePdfDocument resume={resume} />).toBlob()

  downloadBlob(blob, createPdfFilename())
}
