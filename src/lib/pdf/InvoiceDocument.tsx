import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

// Use react-pdf's built-in Helvetica / Courier instead of loading Hanken Grotesk
// over the wire on every render — that was slow, brittle when offline, and
// occasionally hung the route. Branded fonts will be bundled in a follow-up
// once we ship the Edge Function with pre-warmed font files.

const COLOR = {
  ink: '#14110D',
  paper: '#EFEDE7',
  brand: '#EC5A2A',
  line: '#E2DED4',
  muted: '#666661',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLOR.ink,
    padding: 48,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 36 },
  brand: { fontSize: 22, fontWeight: 600, letterSpacing: -0.5 },
  meta: { textAlign: 'right' },
  metaLabel: { color: COLOR.muted, fontSize: 8 },
  metaValue: { fontFamily: 'Courier', fontSize: 10 },
  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  partyTitle: {
    fontSize: 8,
    color: COLOR.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partyName: { fontSize: 12, fontWeight: 600, marginBottom: 2 },
  partyLine: { color: COLOR.muted, marginBottom: 1 },
  table: { borderTop: `1pt solid ${COLOR.line}` },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: `1pt solid ${COLOR.line}`,
  },
  tableHeader: { color: COLOR.muted, fontSize: 8, textTransform: 'uppercase' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right', fontFamily: 'Courier' },
  colVat: { width: 40, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right', fontFamily: 'Courier' },
  totalsBlock: { marginTop: 24, alignSelf: 'flex-end', width: 240 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { color: COLOR.muted },
  totalValue: { fontFamily: 'Courier' },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1pt solid ${COLOR.ink}`,
  },
  grandLabel: { fontWeight: 600 },
  grandValue: { fontFamily: 'Courier', fontWeight: 600 },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    color: COLOR.muted,
    fontSize: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export interface InvoicePdfData {
  number: string
  issuedAt: string
  dueAt: string
  currency: string
  subtotalCents: bigint | number
  vatCents: bigint | number
  totalCents: bigint | number
  notes?: string | null
  organization: {
    name: string
    org_number?: string | null
    vat_number?: string | null
    address?: { street?: string; postal?: string; city?: string; country?: string } | null
    iban?: string | null
    bankgiro?: string | null
  }
  client: {
    name: string
    email?: string | null
    org_number?: string | null
    vat_number?: string | null
    address?: { street?: string; postal?: string; city?: string; country?: string } | null
  }
  lineItems: Array<{
    description: string
    quantity: number
    unit?: string | null
    unitPriceCents: bigint | number
    vatRate: number
    amountCents: bigint | number
  }>
}

function formatMoney(value: bigint | number, currency: string): string {
  const cents = typeof value === 'bigint' ? value : BigInt(Math.round(value))
  const sign = cents < 0n ? '-' : ''
  const abs = cents < 0n ? -cents : cents
  const whole = abs / 100n
  const frac = (abs % 100n).toString().padStart(2, '0')
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${sign}${wholeStr},${frac} ${currency}`
}

function addressLines(addr: InvoicePdfData['organization']['address']): string[] {
  if (!addr) return []
  return [addr.street, [addr.postal, addr.city].filter(Boolean).join(' '), addr.country].filter(
    (l): l is string => Boolean(l && l.length > 0),
  )
}

export function InvoiceDocument({ invoice }: { invoice: InvoicePdfData }) {
  const orgAddr = addressLines(invoice.organization.address)
  const clientAddr = addressLines(invoice.client.address)
  return (
    <Document title={`Faktura ${invoice.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{invoice.organization.name}</Text>
            {invoice.organization.org_number && (
              <Text style={styles.partyLine}>{invoice.organization.org_number}</Text>
            )}
            {invoice.organization.vat_number && (
              <Text style={styles.partyLine}>VAT {invoice.organization.vat_number}</Text>
            )}
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Faktura</Text>
            <Text style={styles.metaValue}>{invoice.number}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Utfärdad</Text>
            <Text style={styles.metaValue}>{invoice.issuedAt}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Förfaller</Text>
            <Text style={styles.metaValue}>{invoice.dueAt}</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <View>
            <Text style={styles.partyTitle}>From</Text>
            {orgAddr.map((line) => (
              <Text key={line} style={styles.partyLine}>
                {line}
              </Text>
            ))}
          </View>
          <View>
            <Text style={styles.partyTitle}>To</Text>
            <Text style={styles.partyName}>{invoice.client.name}</Text>
            {clientAddr.map((line) => (
              <Text key={line} style={styles.partyLine}>
                {line}
              </Text>
            ))}
            {invoice.client.vat_number && (
              <Text style={styles.partyLine}>VAT {invoice.client.vat_number}</Text>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, { borderBottom: 0 }]}>
            <Text style={[styles.colDesc, styles.tableHeader]}>Beskrivning</Text>
            <Text style={[styles.colQty, styles.tableHeader]}>Antal</Text>
            <Text style={[styles.colPrice, styles.tableHeader]}>À-pris</Text>
            <Text style={[styles.colVat, styles.tableHeader]}>Moms</Text>
            <Text style={[styles.colAmount, styles.tableHeader]}>Belopp</Text>
          </View>
          {invoice.lineItems.map((li, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: PDF render only — no reordering.
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>
                {li.description}
                {li.unit ? ` (${li.unit})` : ''}
              </Text>
              <Text style={styles.colQty}>{li.quantity}</Text>
              <Text style={styles.colPrice}>
                {formatMoney(li.unitPriceCents, invoice.currency)}
              </Text>
              <Text style={styles.colVat}>{li.vatRate}%</Text>
              <Text style={styles.colAmount}>{formatMoney(li.amountCents, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delsumma</Text>
            <Text style={styles.totalValue}>
              {formatMoney(invoice.subtotalCents, invoice.currency)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Moms</Text>
            <Text style={styles.totalValue}>{formatMoney(invoice.vatCents, invoice.currency)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Summa</Text>
            <Text style={styles.grandValue}>
              {formatMoney(invoice.totalCents, invoice.currency)}
            </Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 32 }}>
            <Text style={[styles.partyTitle, { marginBottom: 4 }]}>Anteckningar</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>{invoice.organization.name}</Text>
          {invoice.organization.bankgiro && <Text>Bankgiro {invoice.organization.bankgiro}</Text>}
          {invoice.organization.iban && <Text>IBAN {invoice.organization.iban}</Text>}
        </View>
      </Page>
    </Document>
  )
}
