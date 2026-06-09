alter table projects enable row level security;

create policy "members read org projects"
  on projects for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members write org projects"
  on projects for insert with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "members update org projects"
  on projects for update
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "owners delete org projects"
  on projects for delete
  using (organization_id in (
    select organization_id from memberships
    where user_id = auth.uid() and role in ('owner','admin')
  ));
