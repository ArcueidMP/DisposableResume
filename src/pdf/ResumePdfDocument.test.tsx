// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createDefaultResume } from '../resume/defaults'
import { resumeTemplateOptions } from '../resume/schema'
import type { ResumeDraft, ResumeTemplate } from '../resume/types'
import { validateResume } from '../resume/validation'
import {
  extractPdfFontNames,
  extractPdfLines,
  extractPdfText,
} from '../test/pdf-text'
import { createResumePdfBlob } from './exportResumePdf'

const chineseName = '测试候選人'
// Long enough to need at least two lines in every template at body size.
const chineseHighlight =
  '负责浏览器端履历工具的整体设计与实现，涵盖简体与繁體中文内容的录入、预览与导出，并验证长段中文在每个模板中都可以自然换行、不会溢出页面边界，也不会出现西文连字符。'

function addChineseContent(draft: ResumeDraft) {
  draft.basics.name = chineseName
  draft.basics.location = '吉隆坡'
  draft.skills = ['简体中文', '繁體中文', 'React']
  draft.work[0]!.organization = '示例机构'
  draft.work[0]!.role = '產品工程師'
  draft.work[0]!.highlights = [chineseHighlight]
}

async function renderPdf(
  template: ResumeTemplate,
  edit?: (draft: ResumeDraft) => void,
) {
  const draft = createDefaultResume()

  draft.template = template
  edit?.(draft)

  const validatedResume = validateResume(draft)

  if (!validatedResume.success) {
    throw new Error('Expected the PDF fixture to satisfy the resume schema.')
  }

  return createResumePdfBlob(validatedResume.data)
}

describe('ResumePdfDocument', () => {
  it.each(resumeTemplateOptions)(
    'renders a real $label PDF blob through the production registry',
    async ({ id }) => {
      const blob = await renderPdf(id)

      expect(blob.type).toBe('application/pdf')
      expect(blob.size).toBeGreaterThan(0)
      expect(await blob.slice(0, 5).text()).toBe('%PDF-')
      expect(await extractPdfText(blob)).toContain('Sample Candidate')
    },
  )

  it.each(resumeTemplateOptions)(
    'renders and wraps Chinese text in the $label template',
    async ({ id }) => {
      const blob = await renderPdf(id, addChineseContent)
      const text = await extractPdfText(blob)
      const lines = text.split('\n')

      expect(text).toContain(chineseName)
      expect(text).toContain('简体中文')
      expect(text).toContain('繁體中文')
      expect(text).toContain('示例机构')
      expect(text).toContain('產品工程師')
      // The long highlight wraps onto several lines without inserted hyphens.
      expect(lines.some((line) => line.includes(chineseHighlight))).toBe(false)
      expect(text.replace(/\n/g, '')).toContain(chineseHighlight)
      expect(await extractPdfFontNames(blob)).toEqual(
        expect.arrayContaining([expect.stringContaining('ChironHeiHK')]),
      )
    },
  )

  it.each(['classic-ats', 'modern-ats'] as const)(
    'keeps %s on the built-in fonts when the resume has no CJK text',
    async (id) => {
      expect(await extractPdfFontNames(await renderPdf(id))).toEqual([
        'Helvetica',
        'Helvetica-Bold',
      ])
    },
  )

  it.each([
    ['Latin', 'Sample Candidate', undefined],
    ['Chinese', chineseName, addChineseContent],
  ])(
    'centers the Classic ATS header for %s names',
    async (_label, name, edit) => {
      const lines = await extractPdfLines(await renderPdf('classic-ats', edit))
      const nameLine = lines.find((line) => line.text === name)

      // The page's left padding is 48pt; a centered name starts well inside it.
      expect(nameLine?.x).toBeGreaterThan(150)
    },
  )
})
