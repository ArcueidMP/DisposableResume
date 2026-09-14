import { describe, expect, it } from 'vitest'
import { createDefaultResume } from '../../resume/defaults'
import { createResumePresentation } from '../../resume/presentation'
import type { ResumeDraft } from '../../resume/types'
import { CHINESE_CLEAN_FONT_FAMILY } from './chinese-clean-font-family'
import {
  isStandardFontEncodable,
  resolveResumePdfTypography,
  STANDARD_PDF_FONT_FAMILY,
} from './resume-pdf-typography'

const chineseFieldEdits: ReadonlyArray<
  [field: string, edit: (draft: ResumeDraft) => void]
> = [
  ['name', (draft) => void (draft.basics.name = '测试候選人')],
  ['location', (draft) => void (draft.basics.location = '吉隆坡')],
  [
    'link label',
    (draft) =>
      void (draft.basics.links = [
        { label: '作品集', url: 'https://example.invalid/portfolio' },
      ]),
  ],
  ['skill', (draft) => void (draft.skills = ['简体中文'])],
  ['work role', (draft) => void (draft.work[0]!.role = '產品工程師')],
  [
    'work organization',
    (draft) => void (draft.work[0]!.organization = '示例机构'),
  ],
  ['work location', (draft) => void (draft.work[0]!.location = '远程')],
  [
    'work highlight',
    (draft) => void (draft.work[0]!.highlights = ['负责前端']),
  ],
  [
    'education school',
    (draft) => void (draft.education[0]!.school = '示例大学'),
  ],
  [
    'education credential',
    (draft) => void (draft.education[0]!.credential = '学士'),
  ],
  [
    'education detail',
    (draft) => void (draft.education[0]!.details = ['主修计算机']),
  ],
  ['project name', (draft) => void (draft.projects[0]!.name = '简历工具')],
  [
    'project description',
    (draft) => void (draft.projects[0]!.description = '浏览器端简历生成'),
  ],
  [
    'project highlight',
    (draft) => void (draft.projects[0]!.highlights = ['支持中文']),
  ],
]

const cjkTypography = {
  fontFamily: CHINESE_CLEAN_FONT_FAMILY,
  requiresChineseCleanFonts: true,
  textLayout: 'cjk',
}

function createPresentation(edit?: (draft: ResumeDraft) => void) {
  const draft = createDefaultResume()

  edit?.(draft)

  return createResumePresentation(draft)
}

describe('isStandardFontEncodable', () => {
  it.each([
    '',
    'Sample Candidate',
    'first line\nsecond line',
    'Résumé – naïve “quotes” • €10 … ™',
  ])('accepts WinAnsi text %j', (text) => {
    expect(isStandardFontEncodable(text)).toBe(true)
  })

  it.each(['简体中文', '繁體中文', '履歴書', '이력서', 'Резюме', 'A😀B'])(
    'rejects text %j that Helvetica cannot draw',
    (text) => {
      expect(isStandardFontEncodable(text)).toBe(false)
    },
  )
})

describe('resolveResumePdfTypography', () => {
  it('keeps the built-in font and paragraph layout for Latin-only ATS resumes', () => {
    expect(resolveResumePdfTypography(createPresentation())).toEqual({
      fontFamily: STANDARD_PDF_FONT_FAMILY,
      requiresChineseCleanFonts: false,
      textLayout: 'standard',
    })
  })

  it.each(chineseFieldEdits)(
    'switches to the bundled CJK font when the %s contains Chinese',
    (_field, edit) => {
      expect(resolveResumePdfTypography(createPresentation(edit))).toEqual(
        cjkTypography,
      )
    },
  )

  it('switches the Modern ATS template too', () => {
    const presentation = createPresentation((draft) => {
      draft.template = 'modern-ats'
      draft.basics.name = '测试候選人'
    })

    expect(resolveResumePdfTypography(presentation)).toEqual(cjkTypography)
  })

  it('always uses the bundled CJK font for the Chinese Clean template', () => {
    const presentation = createPresentation((draft) => {
      draft.template = 'chinese-clean'
    })

    expect(resolveResumePdfTypography(presentation)).toEqual(cjkTypography)
  })
})
