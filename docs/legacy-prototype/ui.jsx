// Shared UI atoms.

const Avatar = ({ name, tint = '#D9CDB0', size = 32, style }) => {
  const letter = name ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : '';
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: tint,
      color: 'var(--ink)', fontWeight: 600, fontSize: size * 0.42,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, ...style,
    }}>{letter}</span>
  );
};

const Chip = ({ status, children, style }) => {
  const map = {
    paid:    { bg: 'var(--pos-bg)',  fg: 'var(--pos)',  dot: 'var(--pos)',  label: 'Paid'    },
    pending: { bg: 'var(--warn-bg)', fg: 'var(--warn)', dot: 'var(--warn)', label: 'Pending' },
    overdue: { bg: 'var(--neg-bg)',  fg: 'var(--neg)',  dot: 'var(--neg)',  label: 'Overdue' },
    sent:    { bg: 'var(--info-bg)', fg: 'var(--info)', dot: 'var(--info)', label: 'Sent'    },
    draft:   { bg: 'var(--paper-2)', fg: 'var(--ink-2)',dot: 'var(--ink-3)',label: 'Draft'   },
  };
  const t = map[status] || map.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
      background: t.bg, color: t.fg, ...style,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.dot }} />
      {children || t.label}
    </span>
  );
};

const Button = ({ variant = 'primary', size = 'md', icon, iconRight, children, onClick, style, disabled }) => {
  const palettes = {
    primary:   { bg: 'var(--ink)',  fg: '#F4F1E8',           hover: '#2A2620' },
    brand:     { bg: 'var(--brand)',fg: 'var(--brand-ink)',  hover: 'var(--brand-2)' },
    accent:    { bg: 'var(--accent)',fg: 'var(--accent-ink)',hover: 'var(--accent-2)' },
    secondary: { bg: 'var(--card)', fg: 'var(--ink)',        hover: 'var(--paper-2)', border: '1px solid var(--line-2)' },
    ghost:     { bg: 'transparent', fg: 'var(--ink)',        hover: 'var(--paper-2)' },
    danger:    { bg: 'var(--card)', fg: 'var(--neg)',        hover: 'var(--neg-bg)', border: '1px solid var(--line-2)' },
  };
  const sizes = { sm: { p: '7px 14px', fs: 13 }, md: { p: '11px 20px', fs: 14 }, lg: { p: '14px 24px', fs: 15 } };
  const p = palettes[variant] || palettes.primary;
  const s = sizes[size];
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
        padding: s.p, fontSize: s.fs, fontWeight: 500, letterSpacing: '-0.005em',
        background: hover && !disabled ? p.hover : p.bg, color: p.fg,
        border: p.border || 'none', borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-sans)', opacity: disabled ? 0.5 : 1,
        transition: 'background 120ms cubic-bezier(.2,0,0,1)', whiteSpace: 'nowrap',
        ...style,
      }}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
};

const Card = ({ children, padding = 24, style, onClick }) => (
  <div onClick={onClick} style={{
    background: 'var(--card)', border: '1px solid var(--line)',
    borderRadius: 'var(--r-card)', padding, ...style,
  }}>{children}</div>
);

const IconButton = ({ children, onClick, style, active }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 40, height: 40, borderRadius: '50%',
        background: active ? 'var(--ink)' : (hover ? 'var(--paper-2)' : 'var(--card)'),
        color: active ? 'var(--accent)' : 'var(--ink-2)',
        border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transition: 'all 120ms cubic-bezier(.2,0,0,1)', ...style,
      }}>{children}</button>
  );
};

// $ <Money> – tabular figures for clean numeric columns.
const Money = ({ value, currency = 'EUR', muted, large, style }) => (
  <span style={{
    fontFamily: large ? 'var(--font-display)' : 'var(--font-mono)',
    fontFeatureSettings: '"tnum"',
    color: muted ? 'var(--ink-2)' : 'var(--ink)',
    fontSize: large ? 'inherit' : undefined,
    letterSpacing: large ? '-0.025em' : undefined,
    ...style,
  }}>{fmtMoney(value, currency)}</span>
);

const Field = ({ label, hint, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>{label}</label>}
    {children}
    {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</div>}
  </div>
);

const Input = ({ value, onChange, mono, prefix, suffix, placeholder, style, autoFocus }) => {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--card)',
      border: '1px solid ' + (focus ? 'var(--ink)' : 'var(--line-2)'),
      borderRadius: 12,
      padding: '0 14px',
      boxShadow: focus ? '0 0 0 3px rgba(20,17,13,0.06)' : 'none',
      transition: 'all 120ms', ...style,
    }}>
      {prefix && <span style={{ color: 'var(--ink-3)', fontSize: 14, marginRight: 8 }}>{prefix}</span>}
      <input
        autoFocus={autoFocus}
        value={value} onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          padding: '11px 0', fontSize: 14, color: 'var(--ink)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          fontFeatureSettings: mono ? '"tnum"' : undefined,
        }}/>
      {suffix && <span style={{ color: 'var(--ink-3)', fontSize: 13, marginLeft: 8 }}>{suffix}</span>}
    </div>
  );
};

const Toast = ({ children, show }) => (
  <div style={{
    position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`,
    opacity: show ? 1 : 0, pointerEvents: 'none',
    background: 'var(--ink)', color: '#F4F1E8',
    padding: '12px 20px', borderRadius: 999,
    fontSize: 14, fontWeight: 500, zIndex: 100,
    boxShadow: 'var(--shadow-pop)',
    transition: 'all 200ms cubic-bezier(.2,0,0,1)',
  }}>{children}</div>
);

Object.assign(window, { Avatar, Chip, Button, Card, IconButton, Money, Field, Input, Toast });
