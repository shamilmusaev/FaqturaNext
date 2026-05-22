const Sidebar = ({ screen, onNav }) => {
  const items = [
    { id: 'overview', icon: <IGrid size={20} /> },
    { id: 'invoices', icon: <IInvoice size={20} /> },
    { id: 'clients',  icon: <IUsers size={20} /> },
    { id: 'expenses', icon: <IReceipt size={20} /> },
    { id: 'reports',  icon: <IChart size={20} /> },
    { id: 'settings', icon: <ISettings size={20} /> },
  ];
  const [theme, setTheme] = React.useState('light');
  return (
    <div style={{
      width: 72, flexShrink: 0, height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 0', gap: 8,
    }}>
      {/* theme toggle */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 999, padding: 4, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12,
      }}>
        <button onClick={() => setTheme('light')} style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: theme === 'light' ? 'var(--ink)' : 'transparent',
          color: theme === 'light' ? 'var(--accent)' : 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><ISun size={15} /></button>
        <button onClick={() => setTheme('dark')} style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: theme === 'dark' ? 'var(--ink)' : 'transparent',
          color: theme === 'dark' ? 'var(--accent)' : 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><IMoon size={15} /></button>
      </div>
      {/* main nav */}
      {items.map(item => {
        const active = item.id === screen;
        return (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            width: 44, height: 44, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: active ? 'var(--ink)' : 'transparent',
            color: active ? 'var(--accent)' : 'var(--ink-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 120ms',
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--paper-2)'; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >{item.icon}</button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button style={{
        width: 44, height: 44, borderRadius: 14, border: 'none', cursor: 'pointer',
        background: 'transparent', color: 'var(--ink-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><IHelp size={20} /></button>
      <button style={{
        width: 44, height: 44, borderRadius: 14, border: 'none', cursor: 'pointer',
        background: 'transparent', color: 'var(--ink-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><ILogout size={20} /></button>
    </div>
  );
};

const TopBar = ({ screen, onNav, onNew }) => {
  const items = [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'clients',  label: 'Clients' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'reports',  label: 'Reports' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '20px 32px 8px 8px',
    }}>
      {/* logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16 }}>
        <img src="../../assets/logo.svg" width="40" height="40" style={{ borderRadius: 10 }} />
        <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>faqtura</span>
      </div>
      {/* pill nav */}
      <div style={{
        display: 'inline-flex', background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 999, padding: 5, gap: 2,
      }}>
        {items.map(it => {
          const active = it.id === screen;
          return (
            <button key={it.id} onClick={() => onNav(it.id)} style={{
              border: 'none', cursor: 'pointer',
              padding: '8px 18px', borderRadius: 999, fontSize: 14, fontWeight: 500,
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? '#F4F1E8' : 'var(--ink-2)',
              fontFamily: 'var(--font-sans)',
              transition: 'all 120ms',
            }}>{it.label}</button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      {/* icon cluster */}
      <div style={{
        display: 'inline-flex', background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 999, padding: 5, gap: 2,
      }}>
        <IconButton style={{ border: 'none', background: 'transparent' }}><ISearch size={17} /></IconButton>
        <IconButton style={{ border: 'none', background: 'transparent' }}>
          <span style={{ position: 'relative' }}>
            <IBell size={17} />
            <span style={{
              position: 'absolute', top: -2, right: -2, width: 7, height: 7,
              background: 'var(--neg)', borderRadius: '50%',
            }} />
          </span>
        </IconButton>
        <IconButton style={{ border: 'none', background: 'transparent' }}><IInfo size={17} /></IconButton>
      </div>
      {/* user */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 999, padding: '5px 16px 5px 5px',
      }}>
        <Avatar name="Elin Karlsson" tint="#D9CDB0" size={38} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Elin Karlsson</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>elin@studiokarl.se</span>
        </div>
        <IChevDown size={14} style={{ color: 'var(--ink-3)' }} />
      </div>
    </div>
  );
};

Object.assign(window, { Sidebar, TopBar });
