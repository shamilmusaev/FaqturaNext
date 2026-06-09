-- Tasks inside a project: a planning checklist with an estimate range, a
-- manual actual, and a kanban status. The project's overall estimate range is
-- derived from the sum of its tasks.
create table project_tasks (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  project_id       uuid not null references projects(id) on delete cascade,
  name             text not null,
  est_min_minutes  integer check (est_min_minutes is null or est_min_minutes >= 0),
  est_max_minutes  integer check (est_max_minutes is null or est_max_minutes >= 0),
  actual_minutes   integer check (actual_minutes is null or actual_minutes >= 0),
  status           text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index project_tasks_project_idx on project_tasks (project_id, position);
create index project_tasks_org_idx on project_tasks (organization_id);

create trigger project_tasks_updated_at
  before update on project_tasks
  for each row execute function set_updated_at();
