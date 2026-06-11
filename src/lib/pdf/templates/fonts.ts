// Font choices for invoice templates. Uses the standard PDF base-14 families
// that @react-pdf renders without registering/bundling any files — works
// offline, on the server and in the client preview.

export type FontId = 'sans' | 'serif' | 'mono'

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
]

export function fontStack(id: FontId = 'sans'): FontStack {
  switch (id) {
    case 'serif':
      return { base: 'Times-Roman', bold: 'Times-Bold', mono: 'Courier' }
    case 'mono':
      return { base: 'Courier', bold: 'Courier-Bold', mono: 'Courier' }
    default:
      return { base: 'Helvetica', bold: 'Helvetica-Bold', mono: 'Courier' }
  }
}
