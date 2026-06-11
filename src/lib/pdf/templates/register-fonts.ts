// Client-side registration of the bundled invoice fonts (served from
// /public/fonts). Imported for its side effect by the live preview, which is
// client-only — the server PDF route renders the base-14 fonts, so it never
// needs these. Each weight is registered as its own family so templates can
// reference bold by family name (e.g. "Inter Bold").
import { Font } from '@react-pdf/renderer'

let registered = false

export function registerInvoiceFonts() {
  if (registered) return
  registered = true
  const reg = (family: string, src: string) => Font.register({ family, fonts: [{ src }] })
  reg('Inter', '/fonts/inter-400.ttf')
  reg('Inter Bold', '/fonts/inter-700.ttf')
  reg('Poppins', '/fonts/poppins-400.ttf')
  reg('Poppins Bold', '/fonts/poppins-700.ttf')
  reg('Lora', '/fonts/lora-400.ttf')
  reg('Lora Bold', '/fonts/lora-700.ttf')
  reg('Playfair', '/fonts/playfair-400.ttf')
  reg('Playfair Bold', '/fonts/playfair-700.ttf')
  reg('Roboto Mono', '/fonts/robotomono-400.ttf')
  reg('Roboto Mono Bold', '/fonts/robotomono-700.ttf')
}
