import { Font } from '@react-pdf/renderer'
import { CHINESE_CLEAN_FONT_FAMILY } from './chinese-clean-font-family'

const regularFontAsset = new URL(
  './chiron-hei-hk/ChironHeiHK-Text-R.ttf',
  import.meta.url,
)
const boldFontAsset = new URL(
  './chiron-hei-hk/ChironHeiHK-Text-B.ttf',
  import.meta.url,
)

let fontsRegistered = false

function resolveFontSource(asset: URL) {
  return import.meta.env.SSR ? decodeURIComponent(asset.pathname) : asset.href
}

export function registerChineseCleanFonts() {
  if (fontsRegistered) {
    return
  }

  Font.register({
    family: CHINESE_CLEAN_FONT_FAMILY,
    fonts: [
      {
        src: resolveFontSource(regularFontAsset),
        fontWeight: 400,
      },
      {
        src: resolveFontSource(boldFontAsset),
        fontWeight: 700,
      },
    ],
  })

  fontsRegistered = true
}
