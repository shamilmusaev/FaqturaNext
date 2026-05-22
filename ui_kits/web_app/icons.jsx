// Lucide-style icons. 1.5px stroke, currentColor.
// Each is a simple function component returning an SVG.

const Icon = ({ size = 18, children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IHome      = (p) => <Icon {...p}><path d="M3 12l9-8 9 8"/><path d="M5 10v10h14V10"/></Icon>;
const IInvoice   = (p) => <Icon {...p}><path d="M6 2h9l5 5v15a0 0 0 0 1 0 0H6z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h3"/></Icon>;
const IUsers     = (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const IReceipt   = (p) => <Icon {...p}><path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/></Icon>;
const IChart     = (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 6-7"/></Icon>;
const ISettings  = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></Icon>;
const IHelp      = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></Icon>;
const ILogout    = (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></Icon>;

const ISearch    = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>;
const IBell      = (p) => <Icon {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></Icon>;
const IInfo      = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></Icon>;
const IChevDown  = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
const IChevRight = (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>;
const IPlus      = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IX         = (p) => <Icon {...p}><path d="M18 6L6 18M6 6l18 12" transform="scale(0.66 0.66)" transform-origin="12 12"/></Icon>;
const IClose     = (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>;
const ISend      = (p) => <Icon {...p}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></Icon>;
const IFilter    = (p) => <Icon {...p}><path d="M3 4h18M6 12h12M10 20h4"/></Icon>;
const ICheck     = (p) => <Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>;
const IArrowUp   = (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>;
const IArrowDown = (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>;
const IArrowRight= (p) => <Icon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>;
const IDots      = (p) => <Icon {...p}><circle cx="6"  cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></Icon>;
const ITrash     = (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></Icon>;
const ICalendar  = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Icon>;
const IDownload  = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>;
const ICopy      = (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>;
const IGrid      = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Icon>;
const ISun       = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>;
const IMoon      = (p) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Icon>;

Object.assign(window, {
  IHome, IInvoice, IUsers, IReceipt, IChart, ISettings, IHelp, ILogout,
  ISearch, IBell, IInfo, IChevDown, IChevRight, IPlus, IX, IClose, ISend,
  IFilter, ICheck, IArrowUp, IArrowDown, IArrowRight, IDots, ITrash, ICalendar,
  IDownload, ICopy, IGrid, ISun, IMoon,
});
