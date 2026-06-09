alter table project_tasks enable row level security;

create policy "members read org project tasks"
  on project_tasks for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members write org project tasks"
  on project_tasks for insert with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "members update org project tasks"
  on project_tasks for update
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members delete org project tasks"
  on project_tasks for delete
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));
