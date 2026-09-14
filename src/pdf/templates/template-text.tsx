import { Text, View } from '@react-pdf/renderer'
import type { ComponentProps } from 'react'
import type { ResumePdfTypography } from '../fonts/resume-pdf-typography'
import { CjkWrapText } from './cjk-wrap-text'

type PdfStyle = Exclude<
  NonNullable<ComponentProps<typeof View>['style']>,
  readonly unknown[]
>

export type TemplateTextAlign = 'center' | 'right'

/**
 * One run of resume text. With the standard layout it is a plain react-pdf
 * <Text>, whose paragraph line breaking suits Latin text. With the CJK layout
 * it delegates to CjkWrapText so text without spaces still wraps instead of
 * running off the page.
 */
export function TemplateText({
  align,
  containerStyle,
  lineHeight,
  prefix = '',
  text,
  textLayout,
  textStyle,
}: {
  align?: TemplateTextAlign | undefined
  /** Block-level styles such as margins and widths. */
  containerStyle?: PdfStyle | undefined
  /** Absolute line height, used to size wrapped CJK rows. */
  lineHeight: number
  prefix?: string | undefined
  text: string
  textLayout: ResumePdfTypography['textLayout']
  /** Inline styles such as color, font size, and weight. */
  textStyle?: PdfStyle | undefined
}) {
  if (textLayout === 'cjk') {
    return (
      <CjkWrapText
        align={align}
        containerStyle={containerStyle}
        lineHeight={lineHeight}
        prefix={prefix}
        text={text}
        textStyle={textStyle}
      />
    )
  }

  return (
    <Text
      style={[
        containerStyle ?? {},
        textStyle ?? {},
        align === undefined ? {} : { textAlign: align },
      ]}
    >
      {`${prefix}${text}`}
    </Text>
  )
}
