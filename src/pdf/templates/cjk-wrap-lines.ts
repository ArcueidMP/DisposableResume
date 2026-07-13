const MAX_UNBROKEN_GRAPHEMES = 24
const cjkGraphemePattern =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
const whitespacePattern = /^\s$/u
const safeLatinBreakPattern = /^[/:._?&=#@+-]$/u
const openingPunctuation = new Set([
  '(',
  '[',
  '{',
  '（',
  '［',
  '｛',
  '〔',
  '【',
  '〈',
  '《',
  '「',
  '『',
  '“',
  '‘',
])
const closingPunctuation = new Set([
  ')',
  ']',
  '}',
  ',',
  '.',
  ';',
  ':',
  '!',
  '?',
  '%',
  '）',
  '］',
  '｝',
  '〕',
  '】',
  '〉',
  '》',
  '」',
  '』',
  '”',
  '’',
  '、',
  '，',
  '。',
  '；',
  '：',
  '！',
  '？',
  '％',
  '…',
])
const graphemeSegmenter =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('zh-Hant-HK', { granularity: 'grapheme' })
    : null

function segmentGraphemes(value: string) {
  return graphemeSegmenter === null
    ? Array.from(value)
    : Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment)
}

function splitLatinRun(value: string) {
  const tokens: string[] = []
  let token = ''
  let tokenLength = 0

  for (const grapheme of segmentGraphemes(value)) {
    token += grapheme
    tokenLength += 1

    if (
      safeLatinBreakPattern.test(grapheme) ||
      tokenLength >= MAX_UNBROKEN_GRAPHEMES
    ) {
      tokens.push(token)
      token = ''
      tokenLength = 0
    }
  }

  if (token !== '') {
    tokens.push(token)
  }

  return tokens
}

function isSafeTokenBoundary(graphemes: string[], index: number) {
  const before = graphemes[index - 1]
  const after = graphemes[index]

  return (
    before !== undefined &&
    after !== undefined &&
    !openingPunctuation.has(before) &&
    !closingPunctuation.has(after)
  )
}

function splitOversizedToken(value: string) {
  const graphemes = segmentGraphemes(value)

  if (graphemes.length <= MAX_UNBROKEN_GRAPHEMES) {
    return [value]
  }

  const tokens: string[] = []
  let start = 0

  while (start < graphemes.length) {
    const maximumEnd = Math.min(
      start + MAX_UNBROKEN_GRAPHEMES,
      graphemes.length,
    )
    let end = maximumEnd

    if (maximumEnd < graphemes.length) {
      for (let candidate = maximumEnd; candidate > start; candidate -= 1) {
        if (isSafeTokenBoundary(graphemes, candidate)) {
          end = candidate
          break
        }
      }
    }

    tokens.push(graphemes.slice(start, end).join(''))
    start = end
  }

  return tokens
}

function tokenizeLine(value: string) {
  const tokens: string[] = []
  let latinRun = ''
  let pendingPrefix = ''

  function pushToken(token: string) {
    tokens.push(`${pendingPrefix}${token}`)
    pendingPrefix = ''
  }

  function flushLatinRun() {
    if (latinRun === '') {
      return
    }

    for (const token of splitLatinRun(latinRun)) {
      pushToken(token)
    }

    latinRun = ''
  }

  for (const grapheme of segmentGraphemes(value)) {
    if (cjkGraphemePattern.test(grapheme)) {
      flushLatinRun()
      pushToken(grapheme)
      continue
    }

    if (openingPunctuation.has(grapheme)) {
      flushLatinRun()
      pendingPrefix += grapheme
      continue
    }

    if (closingPunctuation.has(grapheme)) {
      flushLatinRun()

      const punctuation = `${pendingPrefix}${grapheme}`

      pendingPrefix = ''

      if (tokens.length === 0) {
        pendingPrefix = punctuation
      } else {
        tokens[tokens.length - 1] += punctuation
      }

      continue
    }

    if (whitespacePattern.test(grapheme)) {
      flushLatinRun()

      const whitespace = `${pendingPrefix}${grapheme}`

      pendingPrefix = ''

      if (tokens.length === 0) {
        pendingPrefix = whitespace
      } else {
        tokens[tokens.length - 1] += whitespace
      }

      continue
    }

    latinRun += grapheme
  }

  flushLatinRun()

  if (pendingPrefix !== '') {
    if (tokens.length === 0) {
      tokens.push(pendingPrefix)
    } else {
      tokens[tokens.length - 1] += pendingPrefix
    }
  }

  return tokens
}

export function createCjkWrapLines(text: string, prefix = '') {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map(tokenizeLine)
  const firstLine = lines[0]

  if (prefix !== '' && firstLine !== undefined) {
    if (firstLine.length === 0) {
      firstLine.push(prefix)
    } else {
      firstLine[0] = `${prefix}${firstLine[0]}`
    }
  }

  return lines.map((tokens) => tokens.flatMap(splitOversizedToken))
}
