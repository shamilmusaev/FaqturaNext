// Sample data for the Faqtura prototype.
// Real product would obviously fetch this from the API.

const CLIENTS = [
  { id: 'c1', name: 'Nordkraft AB',       org: 'SE556677-8899', tint: '#D9CDB0', country: 'SE', email: 'hello@nordkraft.se' },
  { id: 'c2', name: 'Lyko Studio',        org: 'SE559912-0021', tint: '#C5DCC1', country: 'SE', email: 'finance@lyko.studio' },
  { id: 'c3', name: 'Aksel MÃ¸ller',       org: 'NO998877-1122', tint: '#E8C9C0', country: 'NO', email: 'aksel@moller.no' },
  { id: 'c4', name: 'Elm & Oak',          org: 'SE556501-7740', tint: '#C0CFE0', country: 'SE', email: 'pay@elmoak.se' },
  { id: 'c5', name: 'Visby Bakery',       org: 'SE558822-3311', tint: '#E2D2B5', country: 'SE', email: 'kim@visbybakery.se' },
  { id: 'c6', name: 'Hedlund Arkitekter', org: 'SE556644-9001', tint: '#D0D8C6', country: 'SE', email: 'mail@hedlund.se' },
];

const INVOICES = [
  {
    id: 'INV-2026-0312', clientId: 'c1', status: 'overdue',
    issued: 'Apr 28, 2026', due: 'May 12, 2026', dueRel: '12 d ago', currency: 'EUR',
    items: [
      { id: 1, desc: 'Brand identity --- discovery', qty: 8,  rate: 120, vat: 25, deduction: null },
      { id: 2, desc: 'Brand identity --- design',    qty: 24, rate: 145, vat: 25, deduction: null },
      { id: 3, desc: 'Travel costs',               qty: 1,  rate: 380, vat: 25, deduction: null },
    ],
    timeline: [
      { date: 'May 14, 2026', text: 'Reminder sent' },
      { date: 'May 06, 2026', text: 'Reminder sent' },
      { date: 'Apr 28, 2026', text: 'Invoice sent to hello@nordkraft.se' },
      { date: 'Apr 28, 2026', text: 'Invoice issued' },
    ],
  },
  {
    id: 'INV-2026-0311', clientId: 'c2', status: 'pending',
    issued: 'May 14, 2026', due: 'May 28, 2026', dueRel: 'in 14 d', currency: 'EUR',
    items: [
      { id: 1, desc: 'Photo retouching --- 12 frames', qty: 12, rate: 95, vat: 25, deduction: null },
      { id: 2, desc: 'Color grading',                qty: 1,  rate: 110, vat: 25, deduction: null },
    ],
    timeline: [
      { date: 'May 14, 2026', text: 'Invoice sent to finance@lyko.studio' },
      { date: 'May 14, 2026', text: 'Invoice issued' },
    ],
  },
  {
    id: 'INV-2026-0310', clientId: 'c3', status: 'paid',
    issued: 'May 02, 2026', due: 'May 14, 2026', dueRel: 'paid May 14', currency: 'EUR',
    items: [
      { id: 1, desc: 'Web build --- sprint 2', qty: 1, rate: 980, vat: 25, deduction: null },
    ],
    timeline: [
      { date: 'May 14, 2026', text: 'Paid via bank transfer' },
      { date: 'May 02, 2026', text: 'Invoice sent to aksel@moller.no' },
      { date: 'May 02, 2026', text: 'Invoice issued' },
    ],
  },
  {
    id: 'INV-2026-0309', clientId: 'c4', status: 'pending',
    issued: 'May 09, 2026', due: 'May 23, 2026', dueRel: 'in 9 d', currency: 'EUR',
    items: [
      { id: 1, desc: 'Interior consultation --- 4h',   qty: 4, rate: 140, vat: 25, deduction: { kind: 'ROT', pct: 30 } },
    ],
    timeline: [
      { date: 'May 09, 2026', text: 'Invoice sent to pay@elmoak.se' },
      { date: 'May 09, 2026', text: 'Invoice issued' },
    ],
  },
  {
    id: 'INV-2026-0308', clientId: 'c5', status: 'paid',
    issued: 'Apr 22, 2026', due: 'May 06, 2026', dueRel: 'paid May 05', currency: 'EUR',
    items: [
      { id: 1, desc: 'Bakery packaging design', qty: 1, rate: 1480, vat: 25, deduction: null },
    ],
    timeline: [
      { date: 'May 05, 2026', text: 'Paid via Swish' },
      { date: 'Apr 22, 2026', text: 'Invoice sent to kim@visbybakery.se' },
      { date: 'Apr 22, 2026', text: 'Invoice issued' },
    ],
  },
  {
    id: 'INV-2026-0307', clientId: 'c6', status: 'draft',
    issued: '---', due: '---', dueRel: 'draft', currency: 'EUR',
    items: [
      { id: 1, desc: 'Architectural visualisation', qty: 1, rate: 2200, vat: 25, deduction: null },
    ],
    timeline: [
      { date: 'May 13, 2026', text: 'Draft created' },
    ],
  },
  {
    id: 'INV-2026-0306', clientId: 'c1', status: 'paid',
    issued: 'Apr 10, 2026', due: 'Apr 24, 2026', dueRel: 'paid Apr 22', currency: 'EUR',
    items: [
      { id: 1, desc: 'Brand audit', qty: 1, rate: 2400, vat: 25, deduction: null },
    ],
    timeline: [{ date: 'Apr 22, 2026', text: 'Paid via bank transfer' }],
  },
];

function invoiceTotal(inv) {
  let subtotal = 0, vat = 0, deduction = 0;
  for (const it of inv.items) {
    const line = it.qty * it.rate;
    subtotal += line;
    vat += line * (it.vat / 100);
    if (it.deduction) deduction += line * (it.deduction.pct / 100);
  }
  return {
    subtotal,
    vat,
    deduction,
    total: subtotal + vat - deduction,
  };
}

function fmtMoney(n, currency = 'EUR') {
  const symbol = currency === 'EUR' ? '-‚¬' : currency === 'SEK' ? 'kr' : '$';
  const v = (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol} ${v}`;
}

function clientById(id) { return CLIENTS.find(c => c.id === id); }

Object.assign(window, { CLIENTS, INVOICES, invoiceTotal, fmtMoney, clientById });
