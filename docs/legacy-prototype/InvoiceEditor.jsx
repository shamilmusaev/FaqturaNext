const InvoiceEditor = ({ onClose, onSend, onSaveDraft }) => {
  const [clientId, setClientId] = React.useState('c1');
  const [items, setItems] = React.useState([
    { id: 1, desc: 'Brand identity --- design', qty: 24, rate: 145, vat: 25, deduction: null },
  ]);
  const [due, setDue] = React.useState('May 28, 2026');
  const [notes, setNotes] = React.useState('Thanks for working with me --- payment within 14 days, please.');
  const nextId = React.useRef(2);

  const updateItem = (id, patch) => setItems(items.map(it => it.id === id ? { ...it, ...patch } : it));
  const removeItem = (id) => setItems(items.filter(it => it.id !== id));
  const addItem = () => {
    setItems([...items, { id: nextId.current++, desc: '', qty: 1, rate: 0, vat: 25, deduction: null }]);
  };

  const inv = { id: 'INV-2026-DRAFT', items };
  const { subtotal, vat, deduction, total } = invoiceTotal(inv);
  const c = clientById(clientId);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(20,17,13,0.32)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 60,
      animation: 'fadein 180ms ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 760, height: '100%', background: 'var(--paper)',
        boxShadow: 'var(--shadow-pop)', overflow: 'auto',
        animation: 'slidein 220ms cubic-bezier(.2,0,0,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper)', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 999, border: '1px solid var(--line-2)',
              background: 'var(--card)', cursor: 'pointer', color: 'var(--ink-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IClose size={16} /></button>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New invoice</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Draft</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={onSaveDraft}>Save draft</Button>
            <Button variant="primary" size="sm" icon={<ISend size={14} />} onClick={() => onSend({ clientId, items, due, notes })}>
              Send invoice
            </Button>
          </div>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          {/* Client + due */}
          <Card padding={24}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16 }}>
              <Field label="Client">
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 12,
                  padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                }}>
                  <Avatar name={c.name} tint={c.tint} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{c.org}</div>
                  </div>
                  <select value={clientId} onChange={e => setClientId(e.target.value)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-sans)' }}>
                    {CLIENTS.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Due date">
                <Input value={due} onChange={setDue} suffix={<ICalendar size={14} />} />
              </Field>
            </div>
          </Card>

          {/* Line items */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Line items</div>
              <Button variant="secondary" size="sm" icon={<IPlus size={14} />} onClick={addItem}>Add line</Button>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 70px 110px 80px 110px 32px',
              padding: '12px 24px', background: 'var(--paper)', borderTop: '1px solid var(--line)',
              fontSize: 11, fontWeight: 500, color: 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', alignItems: 'center', gap: 10,
            }}>
              <div>Description</div>
              <div style={{ textAlign: 'right' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>VAT</div>
              <div style={{ textAlign: 'right' }}>Line</div>
              <div></div>
            </div>
            {items.map(it => (
              <LineItemRow key={it.id} item={it} onChange={p => updateItem(it.id, p)} onRemove={() => removeItem(it.id)} />
            ))}
          </Card>

          {/* Totals + notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card padding={20}>
              <Field label="Notes for client">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} style={{
                  background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 12,
                  padding: '11px 14px', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--ink)',
                  outline: 'none', resize: 'vertical',
                }}/>
              </Field>
            </Card>
            <Card padding={20} style={{ background: 'var(--ink)', color: '#F4F1E8', borderColor: 'var(--ink)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <SumRow label="Subtotal" value={fmtMoney(subtotal)} fg="#9B958A" />
                <SumRow label="VAT (25%)" value={fmtMoney(vat)} fg="#9B958A" />
                {deduction > 0 && <SumRow label="ROT/RUT" value={`- ${fmtMoney(deduction)}`} fg="var(--accent)" />}
                <div style={{ height: 1, background: '#2A2620', width: 220, margin: '6px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '120px 120px', gap: 16, alignItems: 'baseline' }}>
                  <div style={{ fontSize: 13, color: '#9B958A', textAlign: 'right' }}>Total</div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32, letterSpacing: '-0.03em',
                    textAlign: 'right', fontFeatureSettings: '"tnum"', color: 'var(--accent)',
                  }}>{fmtMoney(total)}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const SumRow = ({ label, value, fg }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '120px 120px', gap: 16 }}>
    <div style={{ fontSize: 12, color: fg, textAlign: 'right' }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right', fontFeatureSettings: '"tnum"', color: fg === 'var(--accent)' ? 'var(--accent)' : '#F4F1E8' }}>{value}</div>
  </div>
);

const LineItemRow = ({ item, onChange, onRemove }) => {
  const line = item.qty * item.rate;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 70px 110px 80px 110px 32px',
      padding: '10px 24px', borderTop: '1px solid var(--line)',
      alignItems: 'center', gap: 10,
    }}>
      <input value={item.desc} onChange={e => onChange({ desc: e.target.value })} placeholder="Describe the work--¦"
             style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontFamily: 'var(--font-sans)' }}/>
      <input value={item.qty} onChange={e => onChange({ qty: Number(e.target.value) || 0 })} type="number"
             style={{ border: 'none', outline: 'none', background: 'transparent', textAlign: 'right',
                      fontSize: 14, fontFamily: 'var(--font-mono)' }}/>
      <input value={item.rate} onChange={e => onChange({ rate: Number(e.target.value) || 0 })} type="number"
             style={{ border: 'none', outline: 'none', background: 'transparent', textAlign: 'right',
                      fontSize: 14, fontFamily: 'var(--font-mono)' }}/>
      <select value={item.vat} onChange={e => onChange({ vat: Number(e.target.value) })}
              style={{ border: 'none', outline: 'none', background: 'transparent', textAlign: 'right',
                       fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', cursor: 'pointer' }}>
        <option value={25}>25%</option><option value={12}>12%</option><option value={6}>6%</option><option value={0}>0%</option>
      </select>
      <div style={{
        textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500,
        fontFeatureSettings: '"tnum"',
      }}>{fmtMoney(line)}</div>
      <button onClick={onRemove} style={{
        background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
        padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><ITrash size={15} /></button>
    </div>
  );
};

Object.assign(window, { InvoiceEditor });
