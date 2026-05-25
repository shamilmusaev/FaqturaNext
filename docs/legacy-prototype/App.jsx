const App = () => {
  const [screen, setScreen]       = React.useState('overview');
  const [invoices, setInvoices]   = React.useState(INVOICES);
  const [openInvId, setOpenInvId] = React.useState(null);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [toast, setToast]         = React.useState(null);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  };

  const onMarkPaid = (id) => {
    setInvoices(invoices.map(i => i.id === id ? {
      ...i, status: 'paid', dueRel: 'paid today',
      timeline: [{ date: 'May 14, 2026', text: 'Paid via bank transfer' }, ...i.timeline],
    } : i));
    showToast('Marked as paid');
  };

  const onSendReminder = (id) => {
    setInvoices(invoices.map(i => i.id === id ? {
      ...i, timeline: [{ date: 'May 14, 2026', text: 'Reminder sent' }, ...i.timeline],
    } : i));
    showToast('Reminder sent');
  };

  const onSendNew = ({ clientId, items, due }) => {
    const id = `INV-2026-0${313 + invoices.filter(i => i.id.startsWith('INV-2026')).length - 6}`;
    const newInv = {
      id, clientId, status: 'pending',
      issued: 'May 14, 2026', due, dueRel: 'in 14 d', currency: 'EUR',
      items, timeline: [
        { date: 'May 14, 2026', text: `Invoice sent to ${clientById(clientId).email}` },
        { date: 'May 14, 2026', text: 'Invoice issued' },
      ],
    };
    setInvoices([newInv, ...invoices]);
    setEditorOpen(false);
    showToast(`Invoice sent to ${clientById(clientId).name}`);
  };

  const onSaveDraft = () => {
    setEditorOpen(false);
    showToast('Draft saved');
  };

  const openInv = openInvId ? invoices.find(i => i.id === openInvId) : null;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: 'var(--paper)',
      fontFamily: 'var(--font-sans)',
    }}>
      <Sidebar screen={screen} onNav={setScreen} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar screen={screen} onNav={setScreen} onNew={() => setEditorOpen(true)} />
        <div style={{ flex: 1 }}>
          {screen === 'overview' && (
            <Overview
              invoices={invoices}
              onOpenInvoice={setOpenInvId}
              onNew={() => setEditorOpen(true)}
              onMarkPaid={onMarkPaid}
            />
          )}
          {screen === 'invoices' && (
            <Invoices
              invoices={invoices}
              onOpen={setOpenInvId}
              onNew={() => setEditorOpen(true)}
              onMarkPaid={onMarkPaid}
            />
          )}
          {screen === 'clients' && (
            <Clients invoices={invoices} onNewInvoice={() => setEditorOpen(true)} />
          )}
          {(screen === 'expenses' || screen === 'reports' || screen === 'settings') && (
            <PlaceholderScreen name={screen} />
          )}
        </div>
      </div>

      {openInv && (
        <InvoiceDetail
          invoice={openInv}
          onClose={() => setOpenInvId(null)}
          onMarkPaid={(id) => { onMarkPaid(id); }}
          onSendReminder={onSendReminder}
        />
      )}
      {editorOpen && (
        <InvoiceEditor
          onClose={() => setEditorOpen(false)}
          onSend={onSendNew}
          onSaveDraft={onSaveDraft}
        />
      )}
      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
};

const PlaceholderScreen = ({ name }) => {
  const labels = {
    expenses: 'Expenses',
    reports:  'Reports',
    settings: 'Settings',
  };
  return (
    <div style={{ padding: '8px 32px 32px 8px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontWeight: 600,
        fontSize: 48, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '8px 8px 4px',
      }}>{labels[name]}</h1>
      <div className="body" style={{ color: 'var(--ink-2)', padding: '0 8px 24px' }}>
        Not in this prototype --- would live here.
      </div>
      <Card padding={48} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', minHeight: 360, color: 'var(--ink-3)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'var(--paper-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <IGrid size={24} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink-2)' }}>
          {labels[name]} module
        </div>
        <div style={{ fontSize: 13, marginTop: 6, maxWidth: 380 }}>
          The UI kit ships dashboards, invoices, clients, the editor and the detail drawer. Other surfaces use the same chrome.
        </div>
      </Card>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
