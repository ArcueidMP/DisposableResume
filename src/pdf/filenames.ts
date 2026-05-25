const DEFAULT_EXPORT_STEM = 'disposable-resume'
const MAX_STEM_LENGTH = 80
const reservedWindowsNames = new Set([
  'aux',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'con',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
  'nul',
  'prn',
])

type ExportExtension = 'json' | 'pdf'

function replaceUnsafeFilenameCharacters(value: string) {
  return Array.from(value)
    .map((character) => {
      const charCode = character.charCodeAt(0)

      if (charCode < 32 || charCode === 127) {
        return '-'
      }

      if ('<>:"/\\|?*'.includes(character)) {
        return '-'
      }

      return character
    })
    .join('')
}

function sanitizeStem(rawStem: string, extension: ExportExtension) {
  const extensionPattern = new RegExp(`\\.${extension}$`, 'i')
  const asciiSafeStem = replaceUnsafeFilenameCharacters(
    rawStem.trim().replace(extensionPattern, '').normalize('NFKD'),
  )
  const normalized = asciiSafeStem
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._\s-]/g, '')
    .replace(/[._\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, MAX_STEM_LENGTH)
    .replace(/-+$/g, '')

  if (normalized === '' || reservedWindowsNames.has(normalized)) {
    return DEFAULT_EXPORT_STEM
  }

  return normalized
}

export function createSafeExportFilename(
  rawStem: string,
  extension: ExportExtension,
) {
  return `${sanitizeStem(rawStem, extension)}.${extension}`
}

export function createPdfFilename() {
  return createSafeExportFilename(DEFAULT_EXPORT_STEM, 'pdf')
}

export function createJsonFilename() {
  return createSafeExportFilename(DEFAULT_EXPORT_STEM, 'json')
}
