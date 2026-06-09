-- Enforce same-organization referential integrity at the database layer.
-- Application code already checks org membership before linking a project to a
-- client (or a time entry / task to a project), but a composite foreign key
-- makes a cross-organization link impossible even via direct SQL or a logic
-- regression. Defense-in-depth on top of RLS.

-- Composite-unique keys are required as targets for the composite FKs below.
-- (organization_id, id) is trivially unique since id is already the PK.
alter table clients add constraint clients_org_id_key unique (organization_id, id);
alter table projects add constraint projects_org_id_key unique (organization_id, id);

-- projects.client_id must belong to the same org as the project.
alter table projects drop constraint if exists projects_client_id_fkey;
alter table projects
  add constraint projects_client_same_org_fkey
  foreign key (organization_id, client_id)
  references clients (organization_id, id) on delete restrict;

-- time_entries.project_id must belong to the same org as the entry.
alter table time_entries drop constraint if exists time_entries_project_id_fkey;
alter table time_entries
  add constraint time_entries_project_same_org_fkey
  foreign key (organization_id, project_id)
  references projects (organization_id, id) on delete cascade;

-- project_tasks.project_id must belong to the same org as the task.
alter table project_tasks drop constraint if exists project_tasks_project_id_fkey;
alter table project_tasks
  add constraint project_tasks_project_same_org_fkey
  foreign key (organization_id, project_id)
  references projects (organization_id, id) on delete cascade;

-- Add WITH CHECK to the UPDATE policies so a row can never be moved to another
-- organization (the existing USING clause only gates which rows are visible to
-- update, not what organization_id they may be set to).
drop policy if exists "members update org projects" on projects;
create policy "members update org projects"
  on projects for update
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()))
  with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

drop policy if exists "members update org time entries" on time_entries;
create policy "members update org time entries"
  on time_entries for update
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()))
  with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));

drop policy if exists "members update org project tasks" on project_tasks;
create policy "members update org project tasks"
  on project_tasks for update
  using (organization_id in (select organization_id from memberships where user_id = auth.uid()))
  with check (organization_id in (select organization_id from memberships where user_id = auth.uid()));
