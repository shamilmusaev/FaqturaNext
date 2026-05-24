alter table clients enable row level security;

create policy "members read org clients"
  on clients for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members write org clients"
  on clients for insert with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "members update org clients"
  on clients for update
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "owners delete org clients"
  on clients for delete
  using (organization_id in (
    select organization_id from memberships
    where user_id = auth.uid() and role in ('owner','admin')
  ));
