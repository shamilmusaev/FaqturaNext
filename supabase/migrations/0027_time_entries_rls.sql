alter table time_entries enable row level security;

create policy "members read org time entries"
  on time_entries for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members write org time entries"
  on time_entries for insert with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "members update org time entries"
  on time_entries for update
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members delete org time entries"
  on time_entries for delete
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));
