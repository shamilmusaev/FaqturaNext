-- Time tracking: a logged work session against a project. Duration is stored
-- as whole minutes (H:MM in the UI, never decimals).
create table time_entries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  entry_date      date not null,
  minutes         integer not null check (minutes > 0),
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index time_entries_org_date_idx on time_entries (organization_id, entry_date);
create index time_entries_project_date_idx on time_entries (project_id, entry_date);

create trigger time_entries_updated_at
  before update on time_entries
  for each row execute function set_updated_at();
