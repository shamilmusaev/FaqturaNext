import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { type FontStack, fontStack } from './fonts'
import { COLOR, addressLines, formatMoney } from './shared'
import type { InvoiceTemplateProps } from './types'

// Classic template: strict, neutral Swedish invoice. Bordered boxes, a ruled
// table with a shaded header row, no brand colour — looks like a traditional
// faktura printed from accounting software.

const makeStyles = (f: FontStack) =>
  StyleSheet.create({
    page: {
      fontFamily: f.base,
      fontSize: 10,
      color: COLOR.ink,
      padding: 44,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    orgName: { fontSize: 14, fontWeight: 600 },
    orgLine: { color: COLOR.ink2, marginBottom: 1, fontSize: 9 },
    title: { fontSize: 26, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' },
    metaTable: { marginTop: 6 },
    metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
    metaLabel: { color: COLOR.ink2, fontSize: 9, width: 70, textAlign: 'right', marginRight: 8 },
    metaValue: { fontFamily: f.mono, fontSize: 9, width: 90, textAlign: 'right' },
    parties: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    partyBox: {
      flex: 1,
      border: `1pt solid ${COLOR.line2}`,
      padding: 10,
    },
    partyTitle: {
      fontSize: 8,
      color: COLOR.ink2,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    partyName: { fontSize: 11, fontWeight: 600, marginBottom: 2 },
    partyLine: { color: COLOR.ink2, marginBottom: 1, fontSize: 9 },
    table: { border: `1pt solid ${COLOR.line2}` },
    headRow: {
      flexDirection: 'row',
      backgroundColor: COLOR.paper2,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottom: `1pt solid ${COLOR.line2}`,
    },
    bodyRow: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottom: `1pt solid ${COLOR.line}`,
    },
    th: { color: COLOR.ink2, fontSize: 8, textTransform: 'uppercase', fontWeight: 600 },
    colDesc: { flex: 3 },
    colQty: { flex: 1, textAlign: 'right' },
    colPrice: { flex: 1.5, textAlign: 'right', fontFamily: f.mono },
    colVat: { width: 40, textAlign: 'right' },
    colAmount: { flex: 1.5, textAlign: 'right', fontFamily: f.mono },
    totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
    totalsBox: { width: 250, border: `1pt solid ${COLOR.line2}` },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderBottom: `1pt solid ${COLOR.line}`,
    },
    totalLabel: { color: COLOR.ink2 },
    totalValue: { fontFamily: f.mono },
    grandRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 7,
      paddingHorizontal: 10,
      backgroundColor: COLOR.paper2,
    },
    grandLabel: { fontWeight: 600, fontSize: 11 },
    grandValue: { fontFamily: f.mono, fontWeight: 600, fontSize: 11 },
    notes: { marginTop: 20, border: `1pt solid ${COLOR.line}`, padding: 10 },
    payInfo: {
      marginTop: 20,
      flexDirection: 'row',
      gap: 16,
      paddingTop: 10,
      borderTop: `1pt solid ${COLOR.line2}`,
    },
    payCol: { flex: 1 },
  })

export function ClassicTemplate({ invoice }: InvoiceTemplateProps) {
  const styles = makeStyles(fontStack(invoice.font))
  const orgAddr = addressLines(invoice.organization.address)
  const clientAddr = addressLines(invoice.client.address)
  return (
    <Document title={`Faktura ${invoice.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.orgName}>{invoice.organization.name}</Text>
            {orgAddr.map((line) => (
              <Text key={line} style={styles.orgLine}>
                {line}
              </Text>
            ))}
            {invoice.organization.org_number && (
              <Text style={styles.orgLine}>Org.nr {invoice.organization.org_number}</Text>
            )}
            {invoice.organization.vat_number && (
              <Text style={styles.orgLine}>Momsreg.nr {invoice.organization.vat_number}</Text>
            )}
          </View>
          <View>
            <Text style={styles.title}>Faktura</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Fakturanr</Text>
                <Text style={styles.metaValue}>{invoice.number}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Utfärdad</Text>
                <Text style={styles.metaValue}>{invoice.issuedAt}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Förfaller</Text>
                <Text style={styles.metaValue}>{invoice.dueAt}</Text>
              </View>
              {invoice.ocrReference && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>OCR</Text>
                  <Text style={styles.metaValue}>{invoice.ocrReference}</Text>
                </View>
              )}
              {invoice.orderNumber && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Ordernr</Text>
                  <Text style={styles.metaValue}>{invoice.orderNumber}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Avsändare</Text>
            <Text style={styles.partyName}>{invoice.organization.name}</Text>
            {orgAddr.map((line) => (
              <Text key={line} style={styles.partyLine}>
                {line}
              </Text>
            ))}
            {invoice.ourReference && (
              <Text style={styles.partyLine}>Vår referens: {invoice.ourReference}</Text>
            )}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Mottagare</Text>
            <Text style={styles.partyName}>{invoice.client.name}</Text>
            {clientAddr.map((line) => (
              <Text key={line} style={styles.partyLine}>
                {line}
              </Text>
            ))}
            {invoice.client.org_number && (
              <Text style={styles.partyLine}>Org.nr {invoice.client.org_number}</Text>
            )}
            {invoice.client.vat_number && (
              <Text style={styles.partyLine}>VAT {invoice.client.vat_number}</Text>
            )}
            {invoice.theirReference && (
              <Text style={styles.partyLine}>Er referens: {invoice.theirReference}</Text>
            )}
          </View>
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
            <View key={idx} style={styles.bodyRow}>
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
          <View style={styles.totalsBox}>
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
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Att betala</Text>
              <Text style={styles.grandValue}>
                {formatMoney(invoice.totalCents, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={[styles.partyTitle, { marginBottom: 4 }]}>Anteckningar</Text>
            <Text style={{ fontSize: 9 }}>{invoice.notes}</Text>
          </View>
        )}

        {invoice.reverseVat && (
          <Text style={{ marginTop: 12, fontSize: 9, color: COLOR.ink2 }}>
            Omvänd skattskyldighet — moms redovisas av köparen.
          </Text>
        )}

        <View style={styles.payInfo}>
          <View style={styles.payCol}>
            <Text style={styles.partyTitle}>Betalning</Text>
            {invoice.organization.bankgiro && (
              <Text style={styles.partyLine}>Bankgiro {invoice.organization.bankgiro}</Text>
            )}
            {invoice.organization.plusgiro && (
              <Text style={styles.partyLine}>Plusgiro {invoice.organization.plusgiro}</Text>
            )}
            {invoice.organization.iban && (
              <Text style={styles.partyLine}>IBAN {invoice.organization.iban}</Text>
            )}
            {invoice.organization.swish_number && (
              <Text style={styles.partyLine}>Swish {invoice.organization.swish_number}</Text>
            )}
          </View>
          <View style={styles.payCol}>
            <Text style={styles.partyTitle}>Förfallodatum</Text>
            <Text style={styles.partyLine}>{invoice.dueAt}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
