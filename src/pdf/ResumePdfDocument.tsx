import { Document } from '@react-pdf/renderer'
import type { Resume } from '../resume/types'
import { ChineseCleanTemplate } from './templates/chinese-clean'
import { ClassicAtsTemplate } from './templates/classic-ats'
import { ModernAtsTemplate } from './templates/modern-ats'

function renderTemplate(resume: Resume) {
  if (resume.template === 'modern-ats') {
    return <ModernAtsTemplate resume={resume} />
  }

  if (resume.template === 'chinese-clean') {
    return <ChineseCleanTemplate resume={resume} />
  }

  return <ClassicAtsTemplate resume={resume} />
}

export function ResumePdfDocument({ resume }: { resume: Resume }) {
  return <Document>{renderTemplate(resume)}</Document>
}
