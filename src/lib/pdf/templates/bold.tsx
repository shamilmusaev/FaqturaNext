import {
  Circle,
  Document,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import { type FontStack, fontStack } from './fonts'
import { addressLines, formatMoney } from './shared'
import type { InvoiceTemplateProps } from './types'

// "Bold" template — recreation of the faktura3 mockup: a dark full-bleed header
// band with an accent "Faktura" lockup, a coloured items table, a payment +
// totals block and a multi-segment colour bar at the foot. Offered in three
// colourways (red / blue / green) via the `scheme` prop. All server-renderable
// @react-pdf primitives (colour blocks, SVG icons/chevrons, optional logo image).

interface Scheme {
  headerBg: string
  headerInk: string
  headerMuted: string
  accent: string
  accentInk: string
  /** filled = accent-coloured rows with white text (red); light = white rows + icons. */
  tableStyle: 'filled' | 'light'
  rowAlt: string
  rowText: string
  rowSub: string
  rowDivider: string
  bottomBar: string[]
}

const RED: Scheme = {
  headerBg: '#141414',
  headerInk: '#FFFFFF',
  headerMuted: '#B5B5B5',
  accent: '#EF3E2A',
  accentInk: '#FFFFFF',
  tableStyle: 'filled',
  rowAlt: '#E8331C',
  rowText: '#FFFFFF',
  rowSub: '#FBD9D3',
  rowDivider: '#C9301C',
  bottomBar: ['#EF3E2A', '#F36A52', '#C9301C', '#7A1d12', '#141414'],
}

const BLUE: Scheme = {
  headerBg: '#0B2440',
  headerInk: '#FFFFFF',
  headerMuted: '#9FB6CF',
  accent: '#1E73BE',
  accentInk: '#FFFFFF',
  tableStyle: 'light',
  rowAlt: '#EEF4FB',
  rowText: '#15233A',
  rowSub: '#6A7B8F',
  rowDivider: '#DCE6F1',
  bottomBar: ['#0B2440', '#15406E', '#1E73BE', '#3E9AD9', '#7FC0EC'],
}

const GREEN: Scheme = {
  headerBg: '#11271A',
  headerInk: '#FFFFFF',
  headerMuted: '#A6C2AC',
  accent: '#5FA32C',
  accentInk: '#FFFFFF',
  tableStyle: 'light',
  rowAlt: '#F0F6EC',
  rowText: '#16271B',
  rowSub: '#6E8472',
  rowDivider: '#DDE9D4',
  bottomBar: ['#11271A', '#2F5A29', '#5FA32C', '#8AC44E', '#B9DD8C'],
}

const PADX = 34
const GRAY = { box: '#F2F1ED', boxLine: '#E2DED4', ink: '#1A1A1A', muted: '#6B6B66' }

const makeStyles = (f: FontStack) =>
  StyleSheet.create({
    page: { fontFamily: f.base, fontSize: 9, color: GRAY.ink },
    header: {
      paddingHorizontal: PADX,
      paddingTop: 28,
      paddingBottom: 30,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    hLeft: { width: '52%' },
    hRight: { width: '44%' },
    faktura: { fontFamily: f.bold, fontSize: 34, letterSpacing: -0.5 },
    pill: {
      alignSelf: 'flex-start',
      marginTop: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 3,
    },
    pillText: { fontFamily: f.bold, fontSize: 8, letterSpacing: 0.5 },
    senderName: { fontFamily: f.bold, fontSize: 13, marginTop: 12 },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    rightCols: { flexDirection: 'row', gap: 16 },
    rightCol: { flex: 1 },
    capLabel: { fontFamily: f.bold, fontSize: 7, letterSpacing: 0.6 },
    rLine: { fontSize: 8, marginTop: 2 },
    dateBlock: { marginTop: 14 },
    badgeWrap: { alignItems: 'center', marginTop: -16, marginBottom: -4, zIndex: 10 },
    table: { paddingHorizontal: PADX },
    thRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10 },
    th: { fontFamily: f.bold, fontSize: 8, color: '#FFFFFF' },
    row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, alignItems: 'center' },
    cDesc: { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
    cPrice: { flex: 1.6, textAlign: 'right', fontFamily: f.base },
    cQty: { flex: 0.9, textAlign: 'center' },
    cDisc: { flex: 1, textAlign: 'center' },
    cSum: { flex: 1.6, textAlign: 'right', fontFamily: f.base },
    rTitle: { fontFamily: f.bold, fontSize: 9 },
    rSub: { fontSize: 7, marginTop: 1 },
    lower: { flexDirection: 'row', paddingHorizontal: PADX, marginTop: 18, gap: 18 },
    lowerLeft: { width: '50%' },
    lowerRight: { width: '50%' },
    dueBox: { backgroundColor: GRAY.box, borderRadius: 4, padding: 10, marginBottom: 12 },
    sectionTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 3,
      marginBottom: 6,
    },
    sectionTagText: {
      fontFamily: f.bold,
      fontSize: 7,
      color: '#FFFFFF',
      letterSpacing: 0.4,
    },
    payGrid: { flexDirection: 'row', marginBottom: 2 },
    payKey: { width: 70, color: GRAY.muted, fontSize: 8 },
    payVal: { fontSize: 8 },
    terms: { fontSize: 8, color: GRAY.muted, lineHeight: 1.4, marginTop: 2 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    totalLabel: { color: GRAY.muted, fontSize: 9 },
    totalVal: { fontSize: 9 },
    payBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    payBarBody: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    payBarLabel: { fontFamily: f.bold, fontSize: 10, color: '#FFFFFF' },
    payBarVal: { fontFamily: f.bold, fontSize: 11, color: '#FFFFFF' },
    regards: { marginTop: 16, alignItems: 'flex-end' },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      height: 12,
    },
  })

function Icon({ d, color, size = 9 }: { d: string; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  )
}

const PATH = {
  hash: 'M9 4 7 20 M15 4l-2 16 M5 9h15 M4 15h15',
  doc: 'M7 3h7l4 4v14H7z M14 3v4h4',
  pin: 'M12 21c4-4 6-7.2 6-10a6 6 0 10-12 0c0 2.8 2 6 6 10z M12 9.5a1.5 1.5 0 100 0.01',
  mail: 'M3 6h18v12H3z M3 6l9 7 9-7',
  phone: 'M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  check: 'M5 12l5 5 9-11',
}

function ChevronBadge({ size, bg, fg }: { size: number; bg: string; fg: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="18" fill={bg} />
      <Path d="M13 17l7 7 7-7" stroke={fg} strokeWidth={3} fill="none" />
    </Svg>
  )
}

function money(cents: bigint | number, currency: string): string {
  return formatMoney(cents, currency === 'SEK' ? 'kr' : currency)
}

function BoldTemplate({ invoice, scheme }: InvoiceTemplateProps & { scheme: Scheme }) {
  const f = fontStack(invoice.font)
  const styles = makeStyles(f)
  const org = invoice.organization
  const cur = invoice.currency
  const orgAddr = addressLines(org.address)
  const clientAddr = addressLines(invoice.client.address)
  const filled = scheme.tableStyle === 'filled'

  // Derive the pre-discount subtotal and the total discount, to match the mockup
  // which shows Delsumma (gross) + a separate Rabatt line.
  let gross = 0n
  for (const li of invoice.lineItems) {
    const q = li.quantity
    const up = typeof li.unitPriceCents === 'bigint' ? li.unitPriceCents : BigInt(li.unitPriceCents)
    gross += BigInt(Math.round(q * Number(up)))
  }
  const subtotal =
    typeof invoice.subtotalCents === 'bigint'
      ? invoice.subtotalCents
      : BigInt(invoice.subtotalCents)
  const discountTotal = gross - subtotal

  const rates = [...new Set(invoice.lineItems.map((l) => l.vatRate))]
  const momsLabel = invoice.reverseVat
    ? 'Moms (0%)'
    : rates.length === 1
      ? `Moms (${rates[0]}%)`
      : 'Moms'

  return (
    <Document title={`Faktura ${invoice.number}`}>
      <Page size="A4" style={styles.page}>
        {/* ---------- Header ---------- */}
        <View style={[styles.header, { backgroundColor: scheme.headerBg }]}>
          <View style={styles.hLeft}>
            <Text style={[styles.faktura, { color: scheme.accent }]}>Faktura</Text>
            <View style={[styles.pill, { backgroundColor: scheme.accent }]}>
              <Text style={[styles.pillText, { color: scheme.accentInk }]}>
                FAKTURANR: {invoice.number}
              </Text>
            </View>
            <Text style={[styles.senderName, { color: scheme.accent }]}>{org.name}</Text>
            {org.org_number && (
              <View style={styles.contactRow}>
                <Icon d={PATH.hash} color={scheme.accent} />
                <Text style={{ color: scheme.headerMuted, fontSize: 8 }}>
                  Org.nr {org.org_number}
                </Text>
              </View>
            )}
            {org.vat_number && (
              <View style={styles.contactRow}>
                <Icon d={PATH.doc} color={scheme.accent} />
                <Text style={{ color: scheme.headerMuted, fontSize: 8 }}>VAT {org.vat_number}</Text>
              </View>
            )}
            {orgAddr.length > 0 && (
              <View style={styles.contactRow}>
                <Icon d={PATH.pin} color={scheme.accent} />
                <Text style={{ color: scheme.headerMuted, fontSize: 8 }}>{orgAddr.join(', ')}</Text>
              </View>
            )}
          </View>

          <View style={styles.hRight}>
            <View style={styles.rightCols}>
              <View style={styles.rightCol}>
                <Text style={[styles.capLabel, { color: scheme.headerInk }]}>FAKTURERAS TILL:</Text>
                <Text style={[styles.rLine, { color: scheme.headerInk, fontFamily: f.bold }]}>
                  {invoice.client.name}
                </Text>
                {clientAddr.map((l) => (
                  <Text key={l} style={[styles.rLine, { color: scheme.headerMuted }]}>
                    {l}
                  </Text>
                ))}
              </View>
              <View style={styles.rightCol}>
                <Text style={[styles.capLabel, { color: scheme.headerInk }]}>KONTAKT</Text>
                {invoice.client.email && (
                  <Text style={[styles.rLine, { color: scheme.headerMuted }]}>
                    {invoice.client.email}
                  </Text>
                )}
                {invoice.client.vat_number && (
                  <Text style={[styles.rLine, { color: scheme.headerMuted }]}>
                    VAT {invoice.client.vat_number}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.dateBlock}>
              <Text style={[styles.capLabel, { color: scheme.headerInk }]}>FAKTURADATUM:</Text>
              <Text style={[styles.rLine, { color: scheme.headerMuted }]}>{invoice.issuedAt}</Text>
              <Text style={[styles.capLabel, { color: scheme.headerInk, marginTop: 8 }]}>
                FÖRFALLDATUM:
              </Text>
              <Text style={[styles.rLine, { color: scheme.headerMuted }]}>{invoice.dueAt}</Text>
              {invoice.ocrReference && (
                <>
                  <Text style={[styles.capLabel, { color: scheme.headerInk, marginTop: 8 }]}>
                    OCR:
                  </Text>
                  <Text style={[styles.rLine, { color: scheme.headerMuted }]}>
                    {invoice.ocrReference}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Chevron badge straddling header/table */}
        <View style={styles.badgeWrap}>
          <ChevronBadge size={32} bg="#141414" fg="#FFFFFF" />
        </View>

        {/* ---------- Items table ---------- */}
        <View style={styles.table}>
          <View style={[styles.thRow, { backgroundColor: scheme.accent }]}>
            <Text style={[styles.cDesc, styles.th]}>Beskrivning</Text>
            <Text style={[styles.cPrice, styles.th]}>Pris (SEK)</Text>
            <Text style={[styles.cQty, styles.th]}>Antal</Text>
            <Text style={[styles.cDisc, styles.th]}>Rabatt (%)</Text>
            <Text style={[styles.cSum, styles.th]}>Summa (SEK)</Text>
          </View>
          {invoice.lineItems.map((li, idx) => {
            const rowBg = filled
              ? idx % 2 === 0
                ? scheme.accent
                : scheme.rowAlt
              : idx % 2 === 0
                ? '#FFFFFF'
                : scheme.rowAlt
            return (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: PDF render only, no reordering.
                key={idx}
                style={[
                  styles.row,
                  { backgroundColor: rowBg, borderBottom: `1pt solid ${scheme.rowDivider}` },
                ]}
              >
                <View style={styles.cDesc}>
                  {!filled && <Icon d={PATH.check} color={scheme.accent} size={11} />}
                  <View>
                    <Text style={[styles.rTitle, { color: scheme.rowText }]}>
                      {li.description}
                      {li.unit ? ` (${li.unit})` : ''}
                    </Text>
                    {li.discountPercent ? (
                      <Text style={[styles.rSub, { color: scheme.rowSub }]}>
                        −{li.discountPercent}% rabatt
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Text style={[styles.cPrice, { color: scheme.rowText }]}>
                  {money(li.unitPriceCents, cur)}
                </Text>
                <Text style={[styles.cQty, { color: scheme.rowText }]}>{li.quantity}</Text>
                <Text style={[styles.cDisc, { color: scheme.rowText }]}>
                  {li.discountPercent ?? 0}%
                </Text>
                <Text style={[styles.cSum, { color: scheme.rowText }]}>
                  {money(li.amountCents, cur)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* ---------- Lower: payment + totals ---------- */}
        <View style={styles.lower}>
          <View style={styles.lowerLeft}>
            <View style={styles.dueBox}>
              <Text style={{ fontSize: 8, color: GRAY.muted }}>Att betala senast:</Text>
              <Text style={{ fontFamily: f.bold, fontSize: 11, marginTop: 2 }}>
                {invoice.dueAt}
              </Text>
            </View>

            <View style={[styles.sectionTag, { backgroundColor: scheme.headerBg }]}>
              <Text style={styles.sectionTagText}>Betalningsinformation</Text>
            </View>
            {org.bankgiro && (
              <View style={styles.payGrid}>
                <Text style={styles.payKey}>Bankgiro:</Text>
                <Text style={styles.payVal}>{org.bankgiro}</Text>
              </View>
            )}
            {org.plusgiro && (
              <View style={styles.payGrid}>
                <Text style={styles.payKey}>Plusgiro:</Text>
                <Text style={styles.payVal}>{org.plusgiro}</Text>
              </View>
            )}
            {org.swish_number && (
              <View style={styles.payGrid}>
                <Text style={styles.payKey}>Swish:</Text>
                <Text style={styles.payVal}>{org.swish_number}</Text>
              </View>
            )}
            {org.iban && (
              <View style={styles.payGrid}>
                <Text style={styles.payKey}>IBAN:</Text>
                <Text style={styles.payVal}>{org.iban}</Text>
              </View>
            )}
            <View style={styles.payGrid}>
              <Text style={styles.payKey}>Mottagare:</Text>
              <Text style={styles.payVal}>{org.name}</Text>
            </View>

            <View style={[styles.sectionTag, { backgroundColor: scheme.headerBg, marginTop: 12 }]}>
              <Text style={styles.sectionTagText}>Villkor</Text>
            </View>
            <Text style={styles.terms}>
              Betalning skall ske senast förfallodatum. Vid försenad betalning tillkommer
              dröjsmålsränta enligt räntelagen.
            </Text>
            {invoice.notes && <Text style={[styles.terms, { marginTop: 6 }]}>{invoice.notes}</Text>}
          </View>

          <View style={styles.lowerRight}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delsumma:</Text>
              <Text style={styles.totalVal}>{money(gross, cur)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{momsLabel}:</Text>
              <Text style={styles.totalVal}>{money(invoice.vatCents, cur)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Rabatt:</Text>
              <Text style={styles.totalVal}>{money(discountTotal, cur)}</Text>
            </View>
            {invoice.rotRut && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{invoice.rotRut.type}-avdrag:</Text>
                <Text style={styles.totalVal}>-{money(invoice.rotRut.cents, cur)}</Text>
              </View>
            )}

            <View style={styles.payBar}>
              <ChevronBadge size={28} bg="#141414" fg="#FFFFFF" />
              <View style={[styles.payBarBody, { backgroundColor: scheme.accent }]}>
                <Text style={styles.payBarLabel}>Att betala (SEK):</Text>
                <Text style={styles.payBarVal}>{money(invoice.totalCents, cur)}</Text>
              </View>
            </View>

            {invoice.reverseVat && (
              <Text style={{ fontSize: 7, color: GRAY.muted, marginTop: 6 }}>
                Omvänd skattskyldighet — moms redovisas av köparen.
              </Text>
            )}

            <View style={styles.regards}>
              <Text style={{ fontSize: 8, color: GRAY.muted }}>Med vänlig hälsning,</Text>
              <Text style={{ fontFamily: f.bold, fontSize: 9, marginTop: 2 }}>{org.name}</Text>
              {org.logo_url ? (
                <Image
                  src={org.logo_url}
                  style={{ height: 26, marginTop: 8, objectFit: 'contain' }}
                />
              ) : null}
              <Text style={{ fontFamily: f.bold, fontSize: 9, marginTop: 10 }}>
                Tack för förtroendet!
              </Text>
            </View>
          </View>
        </View>

        {/* ---------- Bottom colour bar ---------- */}
        <View style={styles.bottomBar} fixed>
          {scheme.bottomBar.map((c, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static colour segments.
            <View key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </View>
      </Page>
    </Document>
  )
}

export function BoldRedTemplate({ invoice }: InvoiceTemplateProps) {
  return BoldTemplate({ invoice, scheme: RED })
}
export function BoldBlueTemplate({ invoice }: InvoiceTemplateProps) {
  return BoldTemplate({ invoice, scheme: BLUE })
}
export function BoldGreenTemplate({ invoice }: InvoiceTemplateProps) {
  return BoldTemplate({ invoice, scheme: GREEN })
}
