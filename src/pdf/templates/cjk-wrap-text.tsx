import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ComponentProps } from 'react'
import { createCjkWrapLines } from './cjk-wrap-lines'

const styles = StyleSheet.create({
  line: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
})

const justifyContentByAlign = {
  center: 'center',
  left: 'flex-start',
  right: 'flex-end',
} as const

type PdfStyle = NonNullable<ComponentProps<typeof View>['style']>

export type CjkWrapTextAlign = keyof typeof justifyContentByAlign

export function CjkWrapText({
  align = 'left',
  containerStyle,
  lineHeight,
  prefix,
  text,
  textStyle,
}: {
  align?: CjkWrapTextAlign | undefined
  containerStyle?: PdfStyle | undefined
  lineHeight: number
  prefix?: string | undefined
  text: string
  textStyle?: PdfStyle | undefined
}) {
  const lines = createCjkWrapLines(text, prefix)
  const lineStyle = [
    styles.line,
    { justifyContent: justifyContentByAlign[align], minHeight: lineHeight },
  ]
  const renderedLines = lines.map((tokens, lineIndex) => (
    <View key={lineIndex} style={lineStyle}>
      {tokens.length === 0 ? (
        <TextToken style={textStyle} value=" " />
      ) : (
        tokens.map((token, tokenIndex) => (
          <TextToken key={tokenIndex} style={textStyle} value={token} />
        ))
      )}
    </View>
  ))

  return containerStyle === undefined ? (
    <View>{renderedLines}</View>
  ) : (
    <View style={containerStyle}>{renderedLines}</View>
  )
}

function TextToken({
  style,
  value,
}: {
  style: PdfStyle | undefined
  value: string
}) {
  return style === undefined ? (
    <Text>{value}</Text>
  ) : (
    <Text style={style}>{value}</Text>
  )
}
