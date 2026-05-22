const Invoices = ({ invoices, onOpen, onNew, onMarkPaid }) => {
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery]   = React.useState('');

  const counts = {
    all:     invoices.length,
    draft:   invoices.filter(i => i.status === 'draft').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid:    invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };
  const filters = [
    { id: 'all',     label: 'All' },
    { id: 'draft',   label: 'Drafts' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid',    label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
  ];

  const filtered = invoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (query) {
      const c = clientById(inv.clientId);
      const q = query.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !inv.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalOutstanding = filtered
    .filter(i => i.status !== 'paid' && i.status !== 'draft')
    .reduce((s, i) => s + invoiceTotal(i).total, 0);

  return (
    <div style={{ padding: '8px 32px 32px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '8px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: 48, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0,
          }}>Invoices</h1>
          <div className="body" style={{ color: 'var(--ink-2)', marginTop: 4 }}>
            {filtered.length} invoices · {fmtMoney(totalOutstanding)} outstanding
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<IDownload size={16} />}>Export CSV</Button>
          <Button variant="primary" icon={<IPlus size={16} />} onClick={onNew}>New invoice</Button>
        </div>
      </div>

      <Card padding={0} style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
          {/* filter pills */}
          <div style={{
            display: 'inline-flex', background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 999, padding: 4, gap: 2,
          }}>
            {filters.map(f => {
              const active = f.id === filter;
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  border: 'none', cursor: 'pointer', padding: '6px 14px',
                  borderRadius: 999, fontSize: 13, fontWeight: 500,
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? '#F4F1E8' : 'var(--ink-2)',
                  fontFamily: 'var(--font-sans)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  {f.label}
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: active ? 'var(--accent)' : 'var(--ink-3)',
                  }}>{counts[f.id]}</span>
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <Input
            value={query} onChange={setQuery}
            placeholder="Search client or invoice number…"
            prefix={<ISearch size={15} />}
            style={{ width: 320 }}
          />
          <Button variant="secondary" icon={<IFilter size={14} />}>Filter</Button>
        </div>

        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '24px 130px 1fr 130px 110px 110px 110px 40px',
          padding: '12px 24px', background: 'var(--paper)',
          fontSize: 11, fontWeight: 500, color: 'var(--ink-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          alignItems: 'center', gap: 12,
        }}>
          <input type="checkbox" />
          <div>Invoice</div>
          <div>Client</div>
          <div style={{ textAlign: 'right' }}>Amount</div>
          <div>Status</div>
          <div>Issued</div>
          <div>Due</div>
          <div></div>
        </div>

        {filtered.map(inv => (
          <InvoiceRow key={inv.id} inv={inv} onOpen={onOpen} onMarkPaid={onMarkPaid} />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)' }}>
            No invoices match your filters.
          </div>
        )}
      </Card>
    </div>
  );
};

const InvoiceRow = ({ inv, onOpen, onMarkPaid }) => {
  const c = clientById(inv.clientId);
  const total = invoiceTotal(inv).total;
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={() => onOpen(inv.id)}
         onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
         style={{
      display: 'grid', gridTemplateColumns: '24px 130px 1fr 130px 110px 110px 110px 40px',
      padding: '14px 24px', borderTop: '1px solid var(--line)',
      alignItems: 'center', gap: 12, cursor: 'pointer',
      background: hover ? 'var(--paper)' : 'transparent',
    }}>
      <input type="checkbox" onClick={e => e.stopPropagation()} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>{inv.id}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={c.name} tint={c.tint} size={28} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{c.org}</div>
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500,
        textAlign: 'right', fontFeatureSettings: '"tnum"',
      }}>{fmtMoney(total)}</div>
      <div><Chip status={inv.status} /></div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{inv.issued}</div>
      <div style={{ fontSize: 13, color: inv.status === 'overdue' ? 'var(--neg)' : 'var(--ink-2)' }}>
        {inv.due === '—' ? '—' : inv.due}
      </div>
      <div style={{ textAlign: 'right' }}>
        <button onClick={e => e.stopPropagation()} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--ink-3)', padding: 6, borderRadius: 8,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><IDots size={16} /></button>
      </div>
    </div>
  );
};

Object.assign(window, { Invoices });
