# Faqtura web app UI kit

An interactive prototype of the Faqtura web app. Open `index.html`.

## Screens & flows
- **Overview** --- the morning dashboard. Outstanding, paid this month, avg days to pay, recent activity, due-this-week list.
- **Invoices** --- full list with filter pills (All / Drafts / Sent / Paid / Overdue) and a working search.
- **New invoice** --- slide-in drawer with client picker, line items (add/remove, live VAT + ROT/RUT math), recipient, due date, send actions.
- **Clients** --- grid of clients with revenue and outstanding per-client.
- **Invoice detail** --- opens from any list row; shows timeline, sends a reminder, marks as paid.

## Interactions that work
- Pill nav switches screens.
- Filter pills filter the invoice list (live count).
- Searching filters by client name or invoice number.
- "New invoice" opens a drawer; add/remove line items recompute subtotal/VAT/total.
- "Mark as paid" updates the row status in place + drops a row into recent activity.
- "Send reminder" pops a toast and adds a timeline entry on the invoice.

## Files
- `index.html` --- boot file (React + Babel + scripts)
- `App.jsx` --- root, screen router, global state
- `Sidebar.jsx` / `TopBar.jsx` --- chrome
- `Overview.jsx` --- dashboard
- `Invoices.jsx` --- list + filters + search + drawer entry
- `InvoiceEditor.jsx` --- slide-in drawer for new/edit invoice
- `InvoiceDetail.jsx` --- read view with timeline
- `Clients.jsx` --- grid
- `data.js` --- sample data
- `icons.jsx` --- Lucide-style icon set
- `ui.jsx` --- shared atoms (Button, Chip, Card, Avatar, MoneyInput--¦)
