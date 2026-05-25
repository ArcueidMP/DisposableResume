import { describe, expect, it } from 'vitest'
import {
  createJsonFilename,
  createPdfFilename,
  createSafeExportFilename,
} from './filenames'

describe('export filenames', () => {
  it('uses generic PDF and JSON filenames by default', () => {
    expect(createPdfFilename()).toBe('disposable-resume.pdf')
    expect(createJsonFilename()).toBe('disposable-resume.json')
  })

  it('sanitizes path separators, control characters, and duplicate extensions', () => {
    expect(
      createSafeExportFilename(' Fixture / Person?\nResume.pdf ', 'pdf'),
    ).toBe('fixture-person-resume.pdf')
  })

  it('normalizes accents and falls back for unsupported filename stems', () => {
    expect(createSafeExportFilename('Jose Alvarez', 'pdf')).toBe(
      'jose-alvarez.pdf',
    )
    expect(createSafeExportFilename('王小明', 'pdf')).toBe(
      'disposable-resume.pdf',
    )
  })

  it('avoids reserved Windows filenames and caps long stems', () => {
    expect(createSafeExportFilename('CON', 'pdf')).toBe('disposable-resume.pdf')

    const filename = createSafeExportFilename('a'.repeat(120), 'pdf')

    expect(filename).toHaveLength(84)
    expect(filename.endsWith('.pdf')).toBe(true)
  })
})
