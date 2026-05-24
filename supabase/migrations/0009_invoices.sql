create type invoice_status as enum ('draft','sent','paid','overdue','cancelled');

create type invoice_event_type as enum (
  'created','sent','viewed','reminder_sent','marked_paid','cancelled','note_added'
);

create table invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete restrict,
  number          text not null,
  status          invoice_status not null default 'draft',
  issued_at       date not null default current_date,
  due_at          date not null,
  paid_at         timestamptz,
  currency        text not null default 'SEK',
  subtotal_cents  bigint not null default 0,
  vat_cents       bigint not null default 0,
  total_cents     bigint not null default 0,
  notes           text,
  pdf_path        text,
  sent_at         timestamptz,
  reminder_count  int not null default 0,
  last_reminder_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, number)
);

create index invoices_org_status_due_idx on invoices (organization_id, status, due_at);
create index invoices_client_idx on invoices (client_id);

create table invoice_line_items (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  position        int not null,
  description     text not null,
  quantity        numeric(12,3) not null default 1,
  unit            text,
  unit_price_cents bigint not null,
  vat_rate        numeric(5,2) not null default 25,
  amount_cents    bigint not null,
  created_at      timestamptz not null default now()
);

create index invoice_line_items_invoice_idx on invoice_line_items (invoice_id, position);

create table invoice_events (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  type            invoice_event_type not null,
  actor_user_id   uuid references auth.users(id) on delete set null,
  payload         jsonb,
  created_at      timestamptz not null default now()
);

create index invoice_events_invoice_idx on invoice_events (invoice_id, created_at desc);

create table invoice_number_sequences (
  organization_id uuid not null references organizations(id) on delete cascade,
  year            int not null,
  last_value      int not null default 0,
  primary key (organization_id, year)
);

create trigger invoices_updated_at
  before update on invoices
  for each row execute function set_updated_at();
