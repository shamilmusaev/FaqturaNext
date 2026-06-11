// Font choices for invoice templates.
// - sans / serif / mono use the standard PDF base-14 families (always available,
//   no files, render on the server too).
// - the rest are bundled TTFs in /public/fonts, registered on the client (see
//   register-fonts.ts) and used in the live preview + its download.

export type FontId =
  | 'sans'
  | 'serif'
  | 'mono'
  | 'inter'
  | 'poppins'
  | 'lora'
  | 'playfair'
  | 'robotomono'

export interface FontStack {
  base: string
  bold: string
  /** Tabular figures for amounts; kept monospaced regardless of base font. */
  mono: string
}

export const FONT_OPTIONS: { id: FontId; name: string }[] = [
  { id: 'sans', name: 'Sans' },
  { id: 'serif', name: 'Serif' },
  { id: 'mono', name: 'Mono' },
  { id: 'inter', name: 'Inter' },
  { id: 'poppins', name: 'Poppins' },
  { id: 'lora', name: 'Lora' },
  { id: 'playfair', name: 'Playfair' },
  { id: 'robotomono', name: 'Roboto Mono' },
]

const STACKS: Record<FontId, FontStack> = {
  sans: { base: 'Helvetica', bold: 'Helvetica-Bold', mono: 'Courier' },
  serif: { base: 'Times-Roman', bold: 'Times-Bold', mono: 'Courier' },
  mono: { base: 'Courier', bold: 'Courier-Bold', mono: 'Courier' },
  inter: { base: 'Inter', bold: 'Inter Bold', mono: 'Courier' },
  poppins: { base: 'Poppins', bold: 'Poppins Bold', mono: 'Courier' },
  lora: { base: 'Lora', bold: 'Lora Bold', mono: 'Courier' },
  playfair: { base: 'Playfair', bold: 'Playfair Bold', mono: 'Courier' },
  robotomono: { base: 'Roboto Mono', bold: 'Roboto Mono Bold', mono: 'Roboto Mono' },
}

export function fontStack(id: FontId = 'sans'): FontStack {
  return STACKS[id] ?? STACKS.sans
}
