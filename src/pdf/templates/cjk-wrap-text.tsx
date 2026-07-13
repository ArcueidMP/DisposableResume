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

type PdfStyle = NonNullable<ComponentProps<typeof View>['style']>

export function CjkWrapText({
  containerStyle,
  lineHeight,
  prefix,
  text,
  textStyle,
}: {
  containerStyle?: PdfStyle
  lineHeight: number
  prefix?: string
  text: string
  textStyle?: PdfStyle
}) {
  const lines = createCjkWrapLines(text, prefix)
  const renderedLines = lines.map((tokens, lineIndex) => (
    <View key={lineIndex} style={[styles.line, { minHeight: lineHeight }]}>
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
