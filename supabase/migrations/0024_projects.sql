-- Time tracking: projects hold an hours estimate (budget) and an optional
-- hourly rate. They reuse existing clients and are org-scoped like everything
-- else. No link to invoices — this is a self-contained tracking section.
create table projects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete restrict,
  name            text not null,
  estimate_minutes integer check (estimate_minutes is null or estimate_minutes >= 0),
  rate_cents      bigint check (rate_cents is null or rate_cents >= 0),
  status          text not null default 'active' check (status in ('active', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index projects_org_status_idx on projects (organization_id, status);
create index projects_client_idx on projects (client_id);

create trigger projects_updated_at
  before update on projects
  for each row execute function set_updated_at();
