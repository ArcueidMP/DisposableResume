import { pdf } from '@react-pdf/renderer'
import { describe, expect, it } from 'vitest'
import { createDefaultResume } from '../resume/defaults'
import { resumeTemplateOptions } from '../resume/schema'
import { validateResume } from '../resume/validation'
import { ResumePdfDocument } from './ResumePdfDocument'

describe('ResumePdfDocument', () => {
  it.each(resumeTemplateOptions)(
    'renders a real $label PDF blob through the production registry',
    async ({ id }) => {
      const draft = createDefaultResume()

      draft.template = id

      const validatedResume = validateResume(draft)

      if (!validatedResume.success) {
        throw new Error(
          'Expected the PDF fixture to satisfy the resume schema.',
        )
      }

      const blob = await pdf(
        <ResumePdfDocument resume={validatedResume.data} />,
      ).toBlob()

      expect(blob.type).toBe('application/pdf')
      expect(blob.size).toBeGreaterThan(0)
      expect(await blob.slice(0, 5).text()).toBe('%PDF-')
    },
  )
})
