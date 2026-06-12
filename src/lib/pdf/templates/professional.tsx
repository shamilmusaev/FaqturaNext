import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { type FontStack, fontStack } from './fonts'
import { addressLines, formatMoney } from './shared'
import type { InvoiceTemplateProps } from './types'

// Professional template ported from the legacy HTML/Tailwind design: a teal
// header band, an info strip, a left-accented client block and a dark table
// header. Demonstrates how much of that look @react-pdf can reproduce
// (colour blocks, borders, rounded corners) while staying server-renderable.

const TEAL = {
  700: '#0F766E',
  800: '#115E59',
  600: '#0D9488',
  200: '#99F6E4',
  100: '#CCFBF1',
  50: '#F0FDFA',
}
const GRAY = { 50: '#F9FAFB', 400: '#9CA3AF', 500: '#6B7280', 700: '#374151' }
const PAGE_PAD = 40

const makeStyles = (f: FontStack) =>
  StyleSheet.create({
    page: { fontFamily: f.base, fontSize: 10, color: '#111111', padding: PAGE_PAD },
    band: {
      backgroundColor: TEAL[700],
      color: '#FFFFFF',
      marginHorizontal: -PAGE_PAD,
      marginTop: -PAGE_PAD,
      paddingHorizontal: PAGE_PAD,
      paddingVertical: 22,
      marginBottom: 22,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bandTitle: { fontSize: 26, fontWeight: 700, letterSpacing: 1 },
    bandSub: { color: TEAL[200], fontSize: 9, marginTop: 2 },
    bandRight: { textAlign: 'right' },
    bandOrg: { fontSize: 15, fontWeight: 700 },
    infoStrip: {
      flexDirection: 'row',
      backgroundColor: TEAL[50],
      borderRadius: 4,
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginBottom: 20,
    },
    infoCell: { flex: 1, alignItems: 'center' },
    infoLabel: { color: TEAL[600], fontSize: 8, fontWeight: 700, marginBottom: 2 },
    infoValue: { fontSize: 10 },
    mono: { fontFamily: f.mono },
    client: {
      borderLeft: `3pt solid ${TEAL[600]}`,
      backgroundColor: GRAY[50],
      padding: 12,
      marginBottom: 20,
    },
    smallLabel: { fontSize: 8, color: GRAY[500], marginBottom: 2, letterSpacing: 0.5 },
    clientName: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
    clientLine: { fontSize: 9, color: GRAY[700], marginBottom: 1 },
    table: { marginBottom: 18 },
    headRow: {
      flexDirection: 'row',
      backgroundColor: TEAL[800],
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    th: { color: '#FFFFFF', fontSize: 8, fontWeight: 700 },
    row: {
      flexDirection: 'row',
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderBottom: `1pt solid ${TEAL[100]}`,
    },
    colDesc: { flex: 3 },
    colQty: { flex: 1, textAlign: 'right' },
    colPrice: { flex: 1.5, textAlign: 'right', fontFamily: f.mono },
    colVat: { width: 40, textAlign: 'right' },
    colAmount: { flex: 1.5, textAlign: 'right', fontFamily: f.mono },
    totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
    totals: { width: 260 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    totalLabel: { color: GRAY[500] },
    totalValue: { fontFamily: f.mono },
    grandBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: TEAL[700],
      color: '#FFFFFF',
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginTop: 6,
    },
    grandLabel: { fontWeight: 700, letterSpacing: 0.5 },
    grandValue: { fontFamily: f.mono, fontWeight: 700 },
    payBox: {
      border: `1pt solid ${TEAL[200]}`,
      backgroundColor: TEAL[50],
      borderRadius: 4,
      padding: 12,
    },
    payTitle: {
      color: TEAL[800],
      fontSize: 9,
      fontWeight: 700,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    payCols: { flexDirection: 'row', gap: 16 },
    payCol: { flex: 1 },
    payLine: { fontSize: 9, marginBottom: 2 },
    notes: { marginTop: 16 },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: PAGE_PAD,
      right: PAGE_PAD,
      textAlign: 'center',
      color: GRAY[400],
      fontSize: 8,
    },
  })

export function ProfessionalTemplate({ invoice }: InvoiceTemplateProps) {
  const styles = makeStyles(fontStack(invoice.font))
  const clientAddr = addressLines(invoice.client.address)
  const org = invoice.organization
  const footerBits = [
    org.org_number ? `Org.nr ${org.org_number}` : null,
    org.vat_number ? `VAT ${org.vat_number}` : null,
  ].filter(Boolean)

  return (
    <Document title={`Faktura ${invoice.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.band} fixed>
          <View>
            <Text style={styles.bandTitle}>FAKTURA</Text>
            <Text style={styles.bandSub}>{invoice.number}</Text>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.bandOrg}>{org.name}</Text>
            {org.vat_number && <Text style={styles.bandSub}>VAT {org.vat_number}</Text>}
          </View>
        </View>

        <View style={styles.infoStrip}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>FAKTURANR</Text>
            <Text style={[styles.infoValue, styles.mono]}>{invoice.number}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>UTFÄRDAD</Text>
            <Text style={styles.infoValue}>{invoice.issuedAt}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>FÖRFALLER</Text>
            <Text style={styles.infoValue}>{invoice.dueAt}</Text>
          </View>
        </View>

        <View style={styles.client}>
          <Text style={styles.smallLabel}>MOTTAGARE</Text>
          <Text style={styles.clientName}>{invoice.client.name}</Text>
          {clientAddr.map((line) => (
            <Text key={line} style={styles.clientLine}>
              {line}
            </Text>
          ))}
          {invoice.client.vat_number && (
            <Text style={styles.clientLine}>VAT {invoice.client.vat_number}</Text>
          )}
          {invoice.theirReference && (
            <Text style={styles.clientLine}>Er referens: {invoice.theirReference}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={[styles.colDesc, styles.th]}>Beskrivning</Text>
            <Text style={[styles.colQty, styles.th]}>Antal</Text>
            <Text style={[styles.colPrice, styles.th]}>À-pris</Text>
            <Text style={[styles.colVat, styles.th]}>Moms</Text>
            <Text style={[styles.colAmount, styles.th]}>Belopp</Text>
          </View>
          {invoice.lineItems.map((li, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: PDF render only, no reordering.
            <View key={idx} style={styles.row}>
              <Text style={styles.colDesc}>
                {li.description}
                {li.unit ? ` (${li.unit})` : ''}
                {li.discountPercent ? ` −${li.discountPercent}%` : ''}
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

        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delsumma</Text>
              <Text style={styles.totalValue}>
                {formatMoney(invoice.subtotalCents, invoice.currency)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Moms</Text>
              <Text style={styles.totalValue}>
                {formatMoney(invoice.vatCents, invoice.currency)}
              </Text>
            </View>
            {invoice.rotRut && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{invoice.rotRut.type}-avdrag</Text>
                <Text style={styles.totalValue}>
                  -{formatMoney(invoice.rotRut.cents, invoice.currency)}
                </Text>
              </View>
            )}
            <View style={styles.grandBar}>
              <Text style={styles.grandLabel}>ATT BETALA</Text>
              <Text style={styles.grandValue}>
                {formatMoney(invoice.totalCents, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.payBox}>
          <Text style={styles.payTitle}>BETALNING</Text>
          <View style={styles.payCols}>
            <View style={styles.payCol}>
              {org.bank_name && <Text style={styles.payLine}>Bank: {org.bank_name}</Text>}
              {org.bankgiro && <Text style={styles.payLine}>Bankgiro: {org.bankgiro}</Text>}
              {org.plusgiro && <Text style={styles.payLine}>Plusgiro: {org.plusgiro}</Text>}
              {org.iban && <Text style={styles.payLine}>IBAN: {org.iban}</Text>}
            </View>
            <View style={styles.payCol}>
              {org.swish_number && <Text style={styles.payLine}>Swish: {org.swish_number}</Text>}
              {invoice.ocrReference && (
                <Text style={styles.payLine}>OCR: {invoice.ocrReference}</Text>
              )}
              {invoice.ourReference && (
                <Text style={styles.payLine}>Vår ref: {invoice.ourReference}</Text>
              )}
              <Text style={styles.payLine}>Förfaller: {invoice.dueAt}</Text>
            </View>
          </View>
        </View>

        {invoice.reverseVat && (
          <Text style={{ marginTop: 12, fontSize: 9, color: GRAY[500] }}>
            Omvänd skattskyldighet — moms redovisas av köparen.
          </Text>
        )}

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.smallLabel}>ANTECKNINGAR</Text>
            <Text style={{ fontSize: 9 }}>{invoice.notes}</Text>
          </View>
        )}

        {footerBits.length > 0 && (
          <Text style={styles.footer} fixed>
            {footerBits.join('   |   ')}
          </Text>
        )}
      </Page>
    </Document>
  )
}
