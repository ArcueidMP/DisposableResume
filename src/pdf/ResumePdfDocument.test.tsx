// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createDefaultResume } from '../resume/defaults'
import { resumeTemplateOptions } from '../resume/schema'
import { validateResume } from '../resume/validation'
import { createResumePdfBlob } from './exportResumePdf'

describe('ResumePdfDocument', () => {
  it.each(resumeTemplateOptions)(
    'renders a real $label PDF blob through the production registry',
    async ({ id }) => {
      const draft = createDefaultResume()

      draft.template = id

      if (id === 'chinese-clean') {
        draft.basics.name = '测试候選人'
        draft.basics.location = '吉隆坡'
        draft.skills = ['简体中文', '繁體中文', 'React']
        draft.work[0]!.organization = '示例机构'
        draft.work[0]!.role = '產品工程師'
        draft.work[0]!.highlights = [
          '负责浏览器端履历工具，涵盖简体与繁體内容，并验证长段中文可以自然换行而不出现西文连字符。',
        ]
      }

      const validatedResume = validateResume(draft)

      if (!validatedResume.success) {
        throw new Error(
          'Expected the PDF fixture to satisfy the resume schema.',
        )
      }

      const blob = await createResumePdfBlob(validatedResume.data)

      expect(blob.type).toBe('application/pdf')
      expect(blob.size).toBeGreaterThan(0)
      expect(await blob.slice(0, 5).text()).toBe('%PDF-')
    },
  )
})
