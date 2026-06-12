import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { type FontStack, fontStack } from './fonts'
import { addressLines } from './shared'
import type { InvoiceTemplateProps } from './types'

// Minimal template — recreation of the user's own freelance invoice (clean,
// airy, white): logo + "Faktura", a Kund / Från two-column block (beige rounded
// box on the right), a borderless hourly-style items table with accent totals,
// a Summa/Moms summary, and a BANK INFO + big TOTALT footer.

const ACCENT = '#EE5A3B'
const INK = '#1A1A1A'
const MUTED = '#8B8579'
const LINE = '#ECE9E1'
const BEIGE = '#F3F1E8'
const PAD = 46

const makeStyles = (f: FontStack) =>
  StyleSheet.create({
    page: { fontFamily: f.base, fontSize: 9.5, color: INK, padding: PAD, lineHeight: 1.3 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
    logoBox: {
      width: 46,
      height: 40,
      borderRadius: 6,
      backgroundColor: ACCENT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoInitials: { color: '#FFFFFF', fontFamily: f.bold, fontSize: 15, letterSpacing: 1 },
    title: { fontFamily: f.bold, fontSize: 26, color: INK, lineHeight: 1.1 },
    subtitle: { fontFamily: f.bold, fontSize: 12, color: INK, marginTop: 3, lineHeight: 1 },
    cols: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    // paddingTop matches the Från box's inner padding so "Kund:" and "Från:" sit
    // on the same baseline.
    colLeft: { width: '50%', paddingTop: 13 },
    colRight: { width: '44%' },
    fromBox: { backgroundColor: BEIGE, borderRadius: 10, padding: 13 },
    label: { color: MUTED },
    strong: { color: INK },
    gap: { height: 7 },
    table: {},
    thRow: { flexDirection: 'row', paddingBottom: 6, borderBottom: `1pt solid ${LINE}` },
    th: { color: MUTED, fontSize: 8 },
    row: { flexDirection: 'row', borderBottom: `1pt solid ${LINE}`, alignItems: 'flex-start' },
    totRow: { flexDirection: 'row' },
    cSpec: { flex: 3.2 },
    cQty: { flex: 1 },
    cPrice: { flex: 1 },
    cSum: { flex: 1.4, textAlign: 'right' },
    sumValue: { color: ACCENT, fontFamily: f.bold },
    summary: { marginTop: 12 },
    summaryLine: { color: INK, marginBottom: 1 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
    micro: { color: MUTED, fontSize: 8, letterSpacing: 1, marginBottom: 6 },
    bankLine: { marginBottom: 1 },
    bigTotal: { color: ACCENT, fontFamily: f.bold, fontSize: 28, textAlign: 'right' },
    contact: {
      position: 'absolute',
      bottom: 20,
      left: PAD,
      right: PAD,
      textAlign: 'center',
      color: MUTED,
      fontSize: 8,
    },
  })

/** Whole kronor with space thousands; öre only when non-zero. No currency suffix. */
function kronor(value: bigint | number): string {
  const cents = typeof value === 'bigint' ? value : BigInt(Math.round(value))
  const abs = cents < 0n ? -cents : cents
  const sign = cents < 0n ? '-' : ''
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const frac = abs % 100n
  return frac === 0n ? `${sign}${whole}` : `${sign}${whole},${frac.toString().padStart(2, '0')}`
}
const kr = (v: bigint | number) => `${kronor(v)} kr`

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

type Addr = { street?: string; postal?: string; city?: string; country?: string } | null | undefined

/** Two display lines: "street, postal" and "city, country". */
function addrTwoLines(a: Addr): [string, string] {
  if (!a) return ['', '']
  const l1 = [a.street, a.postal].filter(Boolean).join(', ')
  const l2 = [a.city, a.country].filter(Boolean).join(', ')
  return [l1, l2]
}

function daysBetween(a: string, b: string): number | null {
  const d1 = new Date(a)
  const d2 = new Date(b)
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000)
}

export function MinimalTemplate({ invoice }: InvoiceTemplateProps) {
  const styles = makeStyles(fontStack(invoice.font))
  const org = invoice.organization
  const [clientAddr1, clientAddr2] = addrTwoLines(invoice.client.address)
  const orgAddr = addressLines(org.address)
  const terms = daysBetween(invoice.issuedAt, invoice.dueAt)

  let totalQty = 0
  let gross = 0n
  for (const li of invoice.lineItems) {
    totalQty += li.quantity
    const up = typeof li.unitPriceCents === 'bigint' ? li.unitPriceCents : BigInt(li.unitPriceCents)
    gross += BigInt(Math.round(li.quantity * Number(up)))
  }
  const subtotal =
    typeof invoice.subtotalCents === 'bigint'
      ? invoice.subtotalCents
      : BigInt(invoice.subtotalCents)
  const discountTotal = gross - subtotal
  const rates = [...new Set(invoice.lineItems.map((l) => l.vatRate))]
  const momsPct = invoice.reverseVat ? 0 : rates.length === 1 ? rates[0] : null

  // Keep the whole invoice on one A4 page: tighten row spacing as the item
  // count grows.
  const n = invoice.lineItems.length
  const rowPad = n > 9 ? 3 : n > 6 ? 5 : n > 4 ? 7 : 10
  const hasNumber = Boolean(invoice.number && invoice.number !== '—')

  return (
    <Document title={`Faktura ${invoice.number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {org.logo_url ? (
            <Image src={org.logo_url} style={{ width: 46, height: 40, objectFit: 'contain' }} />
          ) : (
            <View style={styles.logoBox}>
              <Text style={styles.logoInitials}>{initials(org.name)}</Text>
            </View>
          )}
          <View>
            <Text style={styles.title}>Faktura</Text>
            {hasNumber && <Text style={styles.subtitle}>#{invoice.number}</Text>}
          </View>
        </View>

        {/* Kund / Från */}
        <View style={styles.cols}>
          <View style={styles.colLeft}>
            <Text style={styles.label}>Kund:</Text>
            <Text style={styles.strong}>{invoice.client.name}</Text>
            {invoice.client.org_number && <Text>Org Nummer: {invoice.client.org_number}</Text>}
            {clientAddr1 && <Text>Adress: {clientAddr1}</Text>}
            {clientAddr2 && <Text>{clientAddr2}</Text>}
            <View style={styles.gap} />
            {hasNumber && <Text>Fakturanummer: {invoice.number}</Text>}
            <Text>Fakturadatum: {invoice.issuedAt}</Text>
            <View style={styles.gap} />
            {terms != null && <Text>Betalningsvillkor: {terms} dagar</Text>}
            <Text>Förfallodatum: {invoice.dueAt}</Text>
            {invoice.ocrReference && <Text>OCR: {invoice.ocrReference}</Text>}
          </View>

          <View style={styles.colRight}>
            <View style={styles.fromBox}>
              <Text style={styles.label}>Från:</Text>
              <Text style={styles.strong}>{org.name}</Text>
              {orgAddr.map((l) => (
                <Text key={l}>{l}</Text>
              ))}
              <View style={styles.gap} />
              {org.vat_number && <Text>Vat nummer: {org.vat_number}</Text>}
              {org.org_number && <Text>Org nummer: {org.org_number}</Text>}
              {org.vat_number && (
                <>
                  <View style={styles.gap} />
                  <Text>Godkänd för F-skatt.</Text>
                  <Text>Registrerad för moms</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={[styles.cSpec, styles.th]}>Specifikation</Text>
            <Text style={[styles.cQty, styles.th]}>Antal</Text>
            <Text style={[styles.cPrice, styles.th]}>Á-pris (SEK)</Text>
            <Text style={[styles.cSum, styles.th]}>Summa (SEK){'\n'}exkl. moms</Text>
          </View>
          {invoice.lineItems.map((li, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: PDF render only, no reordering.
            <View key={idx} style={[styles.row, { paddingVertical: rowPad }]}>
              <Text style={styles.cSpec}>
                {li.description}
                {li.discountPercent ? `  (−${li.discountPercent}%)` : ''}
              </Text>
              <Text style={styles.cQty}>
                {li.quantity}
                {li.unit ? ` ${li.unit}` : ''}
              </Text>
              <Text style={styles.cPrice}>{kronor(li.unitPriceCents)}</Text>
              <Text style={[styles.cSum, styles.sumValue]}>{kronor(li.amountCents)}</Text>
            </View>
          ))}
          <View style={[styles.totRow, { paddingVertical: rowPad }]}>
            <Text style={[styles.cSpec, styles.strong]}>Totalt</Text>
            <Text style={[styles.cQty, styles.strong]}>{totalQty}</Text>
            <Text style={styles.cPrice} />
            <Text style={[styles.cSum, styles.sumValue]}>{kronor(subtotal)}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLine}>Summa exkl. moms: {kr(subtotal)}</Text>
          {discountTotal > 0n && (
            <Text style={styles.summaryLine}>Rabatt: {kr(discountTotal)}</Text>
          )}
          <Text style={styles.summaryLine}>
            Moms{momsPct != null ? ` (${momsPct}%)` : ''}: {kr(invoice.vatCents)}
          </Text>
          {invoice.rotRut && (
            <Text style={styles.summaryLine}>
              {invoice.rotRut.type}-avdrag: -{kr(invoice.rotRut.cents)}
            </Text>
          )}
          <Text style={styles.summaryLine}>Totalt att betala: {kr(invoice.totalCents)}</Text>
          {invoice.reverseVat && (
            <Text style={[styles.summaryLine, { color: MUTED, marginTop: 4 }]}>
              Omvänd skattskyldighet — moms redovisas av köparen.
            </Text>
          )}
        </View>

        {/* Footer: bank info + big total */}
        <View style={styles.footer}>
          <View style={{ width: '55%' }}>
            <Text style={styles.micro}>BANK INFO</Text>
            {org.bank_name && <Text style={styles.bankLine}>Bank: {org.bank_name}</Text>}
            {org.bankgiro && <Text style={styles.bankLine}>Bankgiro: {org.bankgiro}</Text>}
            {org.plusgiro && <Text style={styles.bankLine}>Plusgiro: {org.plusgiro}</Text>}
            {org.iban && <Text style={styles.bankLine}>IBAN: {org.iban}</Text>}
            {org.swish_number && <Text style={styles.bankLine}>Swish: {org.swish_number}</Text>}
            <Text style={styles.bankLine}>Mottagare: {org.name}</Text>
          </View>
          <View style={{ width: '40%' }}>
            <Text style={[styles.micro, { textAlign: 'right' }]}>TOTALT</Text>
            <Text style={styles.bigTotal}>{kr(invoice.totalCents)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <Text style={{ marginTop: 24, color: MUTED, fontSize: 9 }}>{invoice.notes}</Text>
        )}

        {(org.org_number || org.vat_number) && (
          <Text style={styles.contact} fixed>
            {org.name}
            {org.org_number ? `   ·   Org.nr ${org.org_number}` : ''}
            {org.vat_number ? `   ·   ${org.vat_number}` : ''}
          </Text>
        )}
      </Page>
    </Document>
  )
}
