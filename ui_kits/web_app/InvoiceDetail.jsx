const InvoiceDetail = ({ invoice, onClose, onMarkPaid, onSendReminder }) => {
  if (!invoice) return null;
  const c = clientById(invoice.clientId);
  const { subtotal, vat, deduction, total } = invoiceTotal(invoice);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,17,13,0.32)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 50,
      animation: 'fadein 180ms ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 720, height: '100%', background: 'var(--paper)',
        boxShadow: 'var(--shadow-pop)', overflow: 'auto',
        animation: 'slidein 220ms cubic-bezier(.2,0,0,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--line)', background: 'var(--paper)',
          position: 'sticky', top: 0, zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 999, border: '1px solid var(--line-2)',
              background: 'var(--card)', cursor: 'pointer', color: 'var(--ink-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IClose size={16} /></button>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>{invoice.id}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" icon={<IDownload size={14} />}>PDF</Button>
            <Button variant="secondary" size="sm" icon={<ICopy size={14} />}>Duplicate</Button>
            {invoice.status !== 'paid' && (
              <Button variant="primary" size="sm" icon={<ICheck size={14} />} onClick={() => onMarkPaid(invoice.id)}>
                Mark as paid
              </Button>
            )}
          </div>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <Card padding={28}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Chip status={invoice.status} />
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 56, letterSpacing: '-0.03em',
                  lineHeight: 1.05, marginTop: 12, fontFeatureSettings: '"tnum"',
                }}>{fmtMoney(total)}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
                  Due {invoice.due} {invoice.status === 'overdue' && <span style={{ color: 'var(--neg)' }}>· {invoice.dueRel}</span>}
                </div>
              </div>
              {invoice.status !== 'paid' && (
                <button onClick={() => onSendReminder(invoice.id)} style={{
                  background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', cursor: 'pointer',
                  borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 500,
                  fontFamily: 'var(--font-sans)', display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  <ISend size={14} /> Send a friendly reminder
                </button>
              )}
            </div>
          </Card>

          {/* Line items */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 100px 80px 100px',
              padding: '14px 24px', background: 'var(--paper)',
              fontSize: 11, fontWeight: 500, color: 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', alignItems: 'center', gap: 8,
            }}>
              <div>Description</div>
              <div style={{ textAlign: 'right' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>VAT</div>
              <div style={{ textAlign: 'right' }}>Line</div>
            </div>
            {invoice.items.map(it => (
              <div key={it.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 100px 80px 100px',
                padding: '14px 24px', borderTop: '1px solid var(--line)',
                alignItems: 'center', gap: 8, fontSize: 14,
              }}>
                <div>
                  {it.desc}
                  {it.deduction && (
                    <span style={{
                      marginLeft: 8, background: 'var(--accent)', color: 'var(--accent-ink)',
                      fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
                    }}>{it.deduction.kind} {it.deduction.pct}%</span>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{it.qty}</div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{fmtMoney(it.rate)}</div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{it.vat}%</div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{fmtMoney(it.qty * it.rate)}</div>
              </div>
            ))}
            <div style={{
              padding: '18px 24px', borderTop: '1px solid var(--line)', background: 'var(--paper)',
              display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
            }}>
              <Row label="Subtotal" value={fmtMoney(subtotal)} />
              <Row label={`VAT (25%)`} value={fmtMoney(vat)} />
              {deduction > 0 && <Row label="ROT/RUT deduction" value={`- ${fmtMoney(deduction)}`} accent />}
              <div style={{ height: 1, background: 'var(--line-2)', width: 240, margin: '4px 0' }} />
              <Row label="Total" value={fmtMoney(total)} big />
            </div>
          </Card>

          {/* Timeline */}
          <Card padding={24}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {invoice.timeline.map((t, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '110px 16px 1fr',
                  alignItems: 'center', gap: 12, padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>{t.date}</div>
                  <span style={{ width: 8, height: 8, borderRadius: '50%',
                    background: t.text.includes('Paid') ? 'var(--pos)'
                      : t.text.includes('Reminder') ? 'var(--warn)'
                      : 'var(--brand)' }} />
                  <div style={{ fontSize: 14 }}>{t.text}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <style>{`
        @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slidein { from { transform: translateX(40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </div>
  );
};

const Row = ({ label, value, big, accent }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '160px 110px', gap: 24 }}>
    <div style={{
      fontSize: big ? 15 : 13, fontWeight: big ? 600 : 400,
      color: big ? 'var(--ink)' : 'var(--ink-2)', textAlign: 'right',
    }}>{label}</div>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: big ? 17 : 13, fontWeight: big ? 600 : 500,
      textAlign: 'right', fontFeatureSettings: '"tnum"',
      color: accent ? 'var(--brand)' : 'var(--ink)',
    }}>{value}</div>
  </div>
);

Object.assign(window, { InvoiceDetail });
