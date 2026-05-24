create table clients (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  email           text,
  org_number      text,
  vat_number      text,
  address         jsonb,
  notes           text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index clients_org_active_idx
  on clients (organization_id, name)
  where archived_at is null;

create index clients_org_all_idx
  on clients (organization_id, name);

create trigger clients_updated_at
  before update on clients
  for each row execute function set_updated_at();
