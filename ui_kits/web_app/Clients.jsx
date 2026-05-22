const Clients = ({ invoices, onNewInvoice }) => {
  const stats = CLIENTS.map(c => {
    const inv = invoices.filter(i => i.clientId === c.id);
    const revenue = inv.filter(i => i.status === 'paid').reduce((s, i) => s + invoiceTotal(i).total, 0);
    const outstanding = inv.filter(i => i.status !== 'paid' && i.status !== 'draft')
                           .reduce((s, i) => s + invoiceTotal(i).total, 0);
    const overdue = inv.some(i => i.status === 'overdue');
    return { c, count: inv.length, revenue, outstanding, overdue };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div style={{ padding: '8px 32px 32px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '8px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: 48, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0,
          }}>Clients</h1>
          <div className="body" style={{ color: 'var(--ink-2)', marginTop: 4 }}>
            {CLIENTS.length} clients · {fmtMoney(stats.reduce((s, x) => s + x.revenue, 0))} in lifetime revenue
          </div>
        </div>
        <Button variant="primary" icon={<IPlus size={16} />}>Add client</Button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      }}>
        {stats.map(({ c, count, revenue, outstanding, overdue }) => (
          <Card key={c.id} padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={c.name} tint={c.tint} size={56} style={{ fontSize: 22 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{c.org} · {c.country}</div>
                </div>
                {overdue && <Chip status="overdue">Overdue</Chip>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                <Stat2 label="Revenue" value={fmtMoney(revenue)} />
                <Stat2 label="Outstanding" value={fmtMoney(outstanding)} alert={outstanding > 0} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14 }}>
                {count} invoice{count === 1 ? '' : 's'} · {c.email}
              </div>
            </div>
            <div style={{
              display: 'flex', gap: 0, borderTop: '1px solid var(--line)', background: 'var(--paper)',
            }}>
              <ActionTile label="New invoice" onClick={onNewInvoice} />
              <ActionTile label="View invoices" />
              <ActionTile label="Message" last />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Stat2 = ({ label, value, alert }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em',
      fontFeatureSettings: '"tnum"', color: alert ? 'var(--neg)' : 'var(--ink)',
    }}>{value}</div>
  </div>
);

const ActionTile = ({ label, onClick, last }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, padding: '14px 16px', border: 'none', cursor: 'pointer',
        background: hover ? 'var(--paper-2)' : 'transparent',
        borderRight: last ? 'none' : '1px solid var(--line)',
        fontSize: 13, fontWeight: 500, color: 'var(--ink-2)',
        fontFamily: 'var(--font-sans)',
      }}>{label}</button>
  );
};

Object.assign(window, { Clients });
