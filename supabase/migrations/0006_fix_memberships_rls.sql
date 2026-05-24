-- Replace recursive "owners manage memberships" policy with a SECURITY DEFINER
-- helper to break the self-referential USING clause that causes 42P17.
create or replace function auth_is_org_owner(org_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = org_id
      and user_id = auth.uid()
      and role = 'owner'
  )
$$;

revoke all on function auth_is_org_owner(uuid) from public;
grant execute on function auth_is_org_owner(uuid) to authenticated;

drop policy if exists "owners manage memberships" on memberships;

create policy "owners manage memberships"
  on memberships for all
  using (auth_is_org_owner(organization_id));
