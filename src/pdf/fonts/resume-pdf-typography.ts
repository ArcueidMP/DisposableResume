import type { ResumePresentation } from '../../resume/presentation'
import { CHINESE_CLEAN_FONT_FAMILY } from './chinese-clean-font-family'

export const STANDARD_PDF_FONT_FAMILY = 'Helvetica'

export type ResumePdfTypography = {
  /** react-pdf font family for the whole document. */
  fontFamily: string
  /** Whether the bundled Chiron Hei HK fonts must be registered first. */
  requiresChineseCleanFonts: boolean
  /**
   * react-pdf only breaks lines at spaces and hyphenation points, so CJK text
   * without spaces never wraps on its own. 'cjk' lays text out token by token
   * (see CjkWrapText) instead of as a single paragraph.
   */
  textLayout: 'standard' | 'cjk'
}

// The built-in PDF fonts (Helvetica and friends) are single-byte WinAnsi fonts.
// They cover Latin-1 plus the typographic extras listed here. Any other
// character has no glyph, and pdfkit writes its raw code point bytes instead,
// which viewers display as unrelated Latin characters.
const standardFontUnsupportedPattern =
  /[^\t\n\r -ÿŒœŠšŸŽžƒˆ˜–—‘-‚“-„†-•…‰‹›€™]/u

export function isStandardFontEncodable(text: string) {
  return !standardFontUnsupportedPattern.test(text)
}

function collectPresentationText(presentation: ResumePresentation) {
  const { header, sections } = presentation

  return [
    header.name,
    header.contact,
    ...header.links,
    ...sections.flatMap((section) => {
      switch (section.kind) {
        case 'skills':
          return section.items
        case 'work':
          return section.items.flatMap((item) => [
            item.role,
            item.organization,
            item.meta,
            ...item.highlights,
          ])
        case 'education':
          return section.items.flatMap((item) => [
            item.school,
            item.credential,
            item.meta,
            ...item.details,
          ])
        case 'projects':
          return section.items.flatMap((item) => [
            item.name,
            item.description,
            ...item.highlights,
          ])
      }
    }),
  ]
}

export function resolveResumePdfTypography(
  presentation: ResumePresentation,
): ResumePdfTypography {
  if (presentation.template === 'chinese-clean') {
    return {
      fontFamily: CHINESE_CLEAN_FONT_FAMILY,
      requiresChineseCleanFonts: true,
      textLayout: 'cjk',
    }
  }

  if (collectPresentationText(presentation).every(isStandardFontEncodable)) {
    return {
      fontFamily: STANDARD_PDF_FONT_FAMILY,
      requiresChineseCleanFonts: false,
      textLayout: 'standard',
    }
  }

  // Switch the whole document to the bundled CJK font instead of mixing it
  // with Helvetica: the token-by-token CJK layout renders each token as its own
  // Text, and tokens set in fonts with different ascents would sit on different
  // baselines. react-pdf still falls back to Helvetica for any glyph the CJK
  // font lacks.
  return {
    fontFamily: CHINESE_CLEAN_FONT_FAMILY,
    requiresChineseCleanFonts: true,
    textLayout: 'cjk',
  }
}
