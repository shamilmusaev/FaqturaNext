alter table organizations enable row level security;
alter table memberships enable row level security;

create policy "members read orgs"
  on organizations for select
  using (id in (select organization_id from memberships where user_id = auth.uid()));

create policy "owners update orgs"
  on organizations for update
  using (id in (select organization_id from memberships where user_id = auth.uid() and role in ('owner','admin')));

create policy "users read own memberships"
  on memberships for select
  using (user_id = auth.uid());

create policy "owners manage memberships"
  on memberships for all
  using (organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'owner'));
