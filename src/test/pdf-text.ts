/// <reference types="node" />

import { inflateSync } from 'node:zlib'

// Minimal reader for the PDFs that @react-pdf/renderer produces in tests. It
// decodes the glyph runs back into text so tests can assert on what a viewer
// would display, including the wrong Latin characters that appear when a
// built-in single-byte font is asked to draw CJK text.

type PdfObject = {
  dictionary: string
  stream: Buffer | null
}

export type PdfTextLine = {
  text: string
  /** Device-space x of the first glyph run on the line, in PDF points. */
  x: number
  /** Device-space baseline, in PDF points from the bottom of the page. */
  y: number
}

type GlyphDecoder = (hex: string) => string

// PDF affine matrix [a b c d e f], row-vector convention.
type Matrix = [number, number, number, number, number, number]

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

const noGlyphs: GlyphDecoder = () => ''

function parsePdfObjects(pdf: Buffer) {
  const source = pdf.toString('latin1')
  const objects = new Map<number, PdfObject>()
  const objectPattern = /(\d+) 0 obj\s*/g
  let objectMatch: RegExpExecArray | null

  while ((objectMatch = objectPattern.exec(source)) !== null) {
    const id = Number(objectMatch[1])
    const bodyStart = objectPattern.lastIndex
    const endIndex = source.indexOf('endobj', bodyStart)
    const streamPattern = /stream\r?\n/g

    streamPattern.lastIndex = bodyStart

    const streamMatch = streamPattern.exec(source)

    if (streamMatch === null || streamMatch.index > endIndex) {
      objects.set(id, {
        dictionary: source.slice(bodyStart, endIndex),
        stream: null,
      })
      continue
    }

    const dictionary = source.slice(bodyStart, streamMatch.index)
    const length = Number(/\/Length (\d+)/.exec(dictionary)?.[1] ?? '0')
    const dataStart = streamMatch.index + streamMatch[0].length

    objects.set(id, {
      dictionary,
      stream: pdf.subarray(dataStart, dataStart + length),
    })
    // Skip the binary stream data so it is never scanned for object headers.
    objectPattern.lastIndex = dataStart + length
  }

  return objects
}

function readStream(object: PdfObject | undefined) {
  if (object === undefined || object.stream === null) {
    return ''
  }

  const data = object.dictionary.includes('/FlateDecode')
    ? inflateSync(object.stream)
    : object.stream

  return data.toString('latin1')
}

function splitHex(hex: string, size: number) {
  return hex.match(new RegExp(`.{1,${size}}`, 'g')) ?? []
}

function createGlyphDecoders(objects: Map<number, PdfObject>) {
  const decoders = new Map<number, GlyphDecoder>()

  for (const [id, { dictionary }] of objects) {
    if (!dictionary.includes('/Type /Font')) {
      continue
    }

    const toUnicodeId = /\/ToUnicode (\d+) 0 R/.exec(dictionary)?.[1]

    if (toUnicodeId !== undefined) {
      // Embedded fonts use two-byte glyph ids mapped through a ToUnicode CMap.
      const glyphs = new Map<string, string>()
      const cmap = readStream(objects.get(Number(toUnicodeId)))

      for (const [, block] of cmap.matchAll(
        /beginbfchar([\s\S]*?)endbfchar/g,
      )) {
        for (const [, code, units] of block!.matchAll(
          /<([0-9a-f]{4})><([0-9a-f ]+)>/gi,
        )) {
          glyphs.set(
            code!.toLowerCase(),
            String.fromCharCode(
              ...units!.split(' ').map((unit) => parseInt(unit, 16)),
            ),
          )
        }
      }

      decoders.set(id, (hex) =>
        splitHex(hex, 4)
          .map((code) => glyphs.get(code.toLowerCase()) ?? '�')
          .join(''),
      )
      continue
    }

    if (dictionary.includes('/Type1')) {
      // Built-in fonts use one byte per glyph in WinAnsi, close to Latin-1.
      decoders.set(id, (hex) =>
        splitHex(hex, 2)
          .map((code) => String.fromCharCode(parseInt(code, 16)))
          .join(''),
      )
    }
  }

  return decoders
}

function resolvePageFonts(
  pageDictionary: string,
  objects: Map<number, PdfObject>,
  decoders: Map<number, GlyphDecoder>,
) {
  const resourcesId = /\/Resources (\d+) 0 R/.exec(pageDictionary)?.[1]
  const resources =
    resourcesId === undefined
      ? pageDictionary
      : (objects.get(Number(resourcesId))?.dictionary ?? '')
  const fonts = new Map<string, GlyphDecoder>()

  for (const [, name, id] of resources.matchAll(/\/(F\d+) (\d+) 0 R/g)) {
    fonts.set(name!, decoders.get(Number(id)) ?? noGlyphs)
  }

  return fonts
}

function toMatrix(operands: string[]): Matrix {
  return [
    Number(operands[0]),
    Number(operands[1]),
    Number(operands[2]),
    Number(operands[3]),
    Number(operands[4]),
    Number(operands[5]),
  ]
}

// Returns m × n, i.e. the transform that applies m first and then n.
function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5],
  ]
}

// react-pdf positions every text run with `cm` translations and a constant
// text matrix, so the device-space baseline is the origin of the text matrix
// pushed through the current transformation matrix.
function decodeContentStream(
  content: string,
  fonts: Map<string, GlyphDecoder>,
) {
  const lines: PdfTextLine[] = []
  const savedMatrices: Matrix[] = []
  let ctm = IDENTITY
  let decoder = noGlyphs
  let line: PdfTextLine | null = null

  for (const command of content.split('\n')) {
    const operands = command.split(' ')
    const operator = operands.pop()

    switch (operator) {
      case 'q':
        savedMatrices.push(ctm)
        break
      case 'Q':
        ctm = savedMatrices.pop() ?? IDENTITY
        break
      case 'cm':
        ctm = multiply(toMatrix(operands), ctm)
        break
      case 'Tf':
        decoder = fonts.get((operands[0] ?? '').slice(1)) ?? noGlyphs
        break
      case 'Tm': {
        const textMatrix = toMatrix(operands)
        const x = textMatrix[4] * ctm[0] + textMatrix[5] * ctm[2] + ctm[4]
        const y = textMatrix[4] * ctm[1] + textMatrix[5] * ctm[3] + ctm[5]

        if (line === null || line.y.toFixed(1) !== y.toFixed(1)) {
          line = { text: '', x, y }
          lines.push(line)
        }

        break
      }
      case 'TJ':
        if (line !== null) {
          for (const [, hex] of command.matchAll(/<([0-9a-f]+)>/gi)) {
            line.text += decoder(hex!)
          }
        }

        break
    }
  }

  return lines.filter(({ text }) => text !== '')
}

/**
 * Returns the text lines of a PDF produced by @react-pdf/renderer, one entry
 * per text baseline with its starting position, in page order.
 */
export async function extractPdfLines(blob: Blob) {
  const objects = parsePdfObjects(Buffer.from(await blob.arrayBuffer()))
  const decoders = createGlyphDecoders(objects)
  const lines: PdfTextLine[] = []

  for (const { dictionary } of objects.values()) {
    if (!/\/Type \/Page\b/.test(dictionary)) {
      continue
    }

    const fonts = resolvePageFonts(dictionary, objects, decoders)
    const contentsId = /\/Contents (\d+) 0 R/.exec(dictionary)?.[1]

    lines.push(
      ...decodeContentStream(
        readStream(objects.get(Number(contentsId))),
        fonts,
      ),
    )
  }

  return lines
}

/**
 * Returns the visible text of a PDF produced by @react-pdf/renderer, one line
 * per text baseline, in page order.
 */
export async function extractPdfText(blob: Blob) {
  return (await extractPdfLines(blob)).map(({ text }) => text).join('\n')
}

/**
 * Returns the sorted base font names referenced by a PDF, without pdfkit's
 * six-letter subset prefix.
 */
export async function extractPdfFontNames(blob: Blob) {
  const objects = parsePdfObjects(Buffer.from(await blob.arrayBuffer()))
  const names = new Set<string>()

  for (const { dictionary } of objects.values()) {
    const name = /\/BaseFont \/(?:[A-Z]{6}\+)?([^\s/>]+)/.exec(dictionary)?.[1]

    if (name !== undefined) {
      names.add(name)
    }
  }

  return [...names].sort()
}
