const Overview = ({ invoices, onOpenInvoice, onNew, onMarkPaid, toast }) => {
  const outstanding = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const overdue     = invoices.filter(i => i.status === 'overdue');
  const paidMonth   = invoices.filter(i => i.status === 'paid');

  const sum = (arr) => arr.reduce((s, i) => s + invoiceTotal(i).total, 0);
  const outstandingAmt = sum(outstanding);
  const paidAmt        = sum(paidMonth);
  const overdueAmt     = sum(overdue);

  const dueThisWeek = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').slice(0, 4);

  return (
    <div style={{ padding: '8px 32px 32px 8px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '8px 8px 4px 8px' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: 56, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0,
          }}>Good morning, Elin</h1>
          <div className="body" style={{ color: 'var(--ink-2)', marginTop: 6 }}>
            You have {outstanding.length} unpaid invoices --- {fmtMoney(outstandingAmt)} outstanding.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<IDownload size={16} />}>Export</Button>
          <Button variant="primary" icon={<IPlus size={16} />} onClick={onNew}>New invoice</Button>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 16 }}>
        <StatHero
          label="Outstanding"
          amount={outstandingAmt}
          sub={`${overdue.length} overdue 路 ${fmtMoney(overdueAmt)}`}
          variant="brand"
          ctaLabel="Send reminders"
        />
        <Stat
          label="Paid this month"
          amount={paidAmt}
          delta={{ dir: 'up', text: '24% vs last month' }}
        />
        <Stat
          label="Avg days to pay"
          amount="12.4"
          delta={{ dir: 'down', text: '2.1 days', positive: true }}
          unit=" d"
        />
        <Stat
          label="Sent this week"
          amount="6"
          delta={{ dir: 'up', text: '-偓11,240 invoiced' }}
        />
      </div>

      {/* Middle row: cashflow chart + due-this-week */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <CashflowChart />
        <DueThisWeek items={dueThisWeek} onOpen={onOpenInvoice} onMarkPaid={onMarkPaid} />
      </div>

      {/* Bottom row: activity + quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <RecentActivity invoices={invoices} onOpen={onOpenInvoice} />
        <QuickActions onNew={onNew} />
      </div>
    </div>
  );
};

const Stat = ({ label, amount, sub, delta, variant, unit }) => {
  const fillBg = variant === 'accent' ? 'var(--accent)' : variant === 'brand' ? 'var(--brand)' : 'var(--card)';
  const fg     = (variant === 'brand' || variant === 'accent') ? 'var(--brand-ink)' : 'var(--ink)';
  const subFg  = (variant === 'brand' || variant === 'accent') ? 'rgba(255,255,255,0.75)' : 'var(--ink-2)';
  return (
    <div style={{
      background: fillBg, borderRadius: 'var(--r-card)',
      border: variant ? 'none' : '1px solid var(--line)',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
      minHeight: 140,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: subFg, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 40, letterSpacing: '-0.03em',
        lineHeight: 1, color: fg, fontFeatureSettings: '"tnum"',
      }}>
        {typeof amount === 'number' ? fmtMoney(amount) : amount}{unit && <span style={{ fontSize: 24, color: subFg }}>{unit}</span>}
      </div>
      {delta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: subFg }}>
          {delta.dir === 'up' ? <IArrowUp size={12} /> : <IArrowDown size={12} />}
          <span>{delta.text}</span>
        </div>
      )}
      {sub && <div style={{ fontSize: 12, color: subFg }}>{sub}</div>}
    </div>
  );
};

const StatHero = ({ label, amount, sub, variant, ctaLabel }) => {
  const fillBg = variant === 'brand' ? 'var(--brand)' : 'var(--card)';
  return (
    <div style={{
      background: fillBg, borderRadius: 'var(--r-card)',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
      color: 'var(--brand-ink)', minHeight: 140, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
        <span style={{
          background: 'var(--ink)', color: 'var(--brand-ink)',
          fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 999,
        }}>Live</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 56, letterSpacing: '-0.03em',
        lineHeight: 1, color: 'var(--brand-ink)', fontFeatureSettings: '"tnum"',
      }}>{fmtMoney(amount)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{sub}</div>
        <button style={{
          background: 'rgba(255,255,255,0.16)', color: 'var(--brand-ink)',
          border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999,
          padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}>{ctaLabel} -啋</button>
      </div>
    </div>
  );
};

const CashflowChart = () => {
  // Simple bar chart: paid vs outstanding per month
  const data = [
    { m: 'Dec', paid: 6.2, out: 1.1 },
    { m: 'Jan', paid: 8.4, out: 0.8 },
    { m: 'Feb', paid: 7.1, out: 1.8 },
    { m: 'Mar', paid: 9.8, out: 2.4 },
    { m: 'Apr', paid: 11.2, out: 1.6 },
    { m: 'May', paid: 18.3, out: 4.8 },
  ];
  const max = 24;
  const H = 200;
  return (
    <Card padding={24} style={{ minHeight: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>Cashflow</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 4 }}>
            -偓 23,130 <span style={{ fontSize: 16, color: 'var(--ink-3)' }}>last 6 months</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <Legend color="var(--brand)" label="Paid" />
          <Legend color="var(--ink)" label="Outstanding" />
          <select style={{
            background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 999,
            padding: '5px 12px', fontSize: 12, color: 'var(--ink-2)', fontFamily: 'var(--font-sans)',
          }}>
            <option>6 mo</option><option>12 mo</option><option>YTD</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 28, height: H, position: 'relative' }}>
        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0, bottom: H * p,
            borderTop: '1px dashed var(--line)',
          }}>
            <span style={{ fontSize: 10, color: 'var(--ink-3)', position: 'absolute', right: 0, top: -8, background: 'var(--card)', padding: '0 4px' }}>
              -偓 {Math.round(max * p)}k
            </span>
          </div>
        ))}
        {data.map((d, i) => {
          const isLatest = i === data.length - 1;
          return (
            <div key={d.m} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end', gap: 8,
              height: '100%', position: 'relative', zIndex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: H }}>
                <div style={{
                  width: 16, background: 'var(--brand)',
                  opacity: isLatest ? 1 : 0.85,
                  height: (d.paid / max) * H, borderRadius: '6px 6px 0 0',
                }} />
                <div style={{
                  width: 16, background: 'var(--ink)',
                  opacity: isLatest ? 1 : 0.85,
                  height: (d.out / max) * H, borderRadius: '6px 6px 0 0',
                }} />
              </div>
            </div>
          );
        })}
        <div style={{
          position: 'absolute', bottom: -24, left: 0, right: 0, display: 'flex',
          fontSize: 11, color: 'var(--ink-3)',
        }}>
          {data.map(d => <div key={d.m} style={{ flex: 1, textAlign: 'center' }}>{d.m}</div>)}
        </div>
      </div>
    </Card>
  );
};

const Legend = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
    {label}
  </div>
);

const DueThisWeek = ({ items, onOpen, onMarkPaid }) => (
  <Card padding={0} style={{ minHeight: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>Due this week</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{items.length} invoices</div>
      </div>
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--ink-3)', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
      }}>All -啋</button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {items.map((inv, i) => {
        const c = clientById(inv.clientId);
        const total = invoiceTotal(inv).total;
        return (
          <div key={inv.id} onClick={() => onOpen(inv.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
            borderTop: '1px solid var(--line)', cursor: 'pointer',
          }} onMouseEnter={e => e.currentTarget.style.background = 'var(--paper)'}
             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Avatar name={c.name} tint={c.tint} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{inv.id} 路 {inv.dueRel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, fontFeatureSettings: '"tnum"' }}>
                {fmtMoney(total)}
              </div>
              <Chip status={inv.status} style={{ marginTop: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

const RecentActivity = ({ invoices, onOpen }) => {
  // Most recent timeline entries across invoices
  const events = [];
  for (const inv of invoices) {
    for (const t of inv.timeline) events.push({ ...t, inv });
  }
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  const visible = events.slice(0, 6);

  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 600 }}>Recent activity</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="secondary" size="sm" icon={<IFilter size={14} />}>Filter</Button>
        </div>
      </div>
      <div>
        {visible.map((e, i) => {
          const c = clientById(e.inv.clientId);
          return (
            <div key={i} onClick={() => onOpen(e.inv.id)} style={{
              display: 'grid', gridTemplateColumns: '8px 1fr auto', alignItems: 'center', gap: 14,
              padding: '12px 24px', borderTop: '1px solid var(--line)', cursor: 'pointer',
            }} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--paper)'}
               onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 8, height: 8, borderRadius: '50%',
                background: e.text.includes('Paid') ? 'var(--pos)'
                  : e.text.includes('Reminder') ? 'var(--warn)'
                  : e.text.includes('sent') ? 'var(--info)'
                  : 'var(--ink-3)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={c.name} tint={c.tint} size={28} />
                <div>
                  <div style={{ fontSize: 14 }}>
                    <strong style={{ fontWeight: 600 }}>{c.name}</strong>
                    <span style={{ color: 'var(--ink-2)' }}> 路 {e.text}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {e.inv.id} 路 {e.date}
                  </div>
                </div>
              </div>
              <IChevRight size={14} style={{ color: 'var(--ink-3)' }} />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const QuickActions = ({ onNew }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Card padding={24} style={{ background: 'var(--ink)', color: '#F4F1E8', borderColor: 'var(--ink)' }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#9B958A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Quick send</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, lineHeight: 1.1, marginTop: 8, letterSpacing: '-0.02em' }}>
        Bill a client in under 30 seconds
      </div>
      <div style={{ fontSize: 13, color: '#9B958A', marginTop: 8 }}>
        Pick a client, add lines, send. We'll handle VAT, ROT/RUT, e-invoice routing.
      </div>
      <button onClick={onNew} style={{
        background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', cursor: 'pointer',
        borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 500,
        marginTop: 16, fontFamily: 'var(--font-sans)', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        New invoice <IArrowRight size={14} />
      </button>
    </Card>
    <Card padding={20}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>VAT due --- Q2</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, letterSpacing: '-0.03em', marginTop: 6, fontFeatureSettings: '"tnum"' }}>
            -偓 4,580
          </div>
        </div>
        <span style={{
          background: 'var(--warn-bg)', color: 'var(--warn)',
          fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 999,
        }}>Due Jul 25</span>
      </div>
      <div style={{
        background: 'var(--paper-2)', height: 8, borderRadius: 999, marginTop: 14, overflow: 'hidden',
      }}>
        <div style={{ background: 'var(--warn)', height: '100%', width: '64%', borderRadius: 999 }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>Set aside -偓2,930 of -偓4,580</div>
    </Card>
  </div>
);

Object.assign(window, { Overview });
