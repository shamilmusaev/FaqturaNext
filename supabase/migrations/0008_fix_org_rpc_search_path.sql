-- Harden SECURITY DEFINER function: explicit search_path prevents schema shadowing.
create or replace function create_organization(
  p_name text,
  p_org_number text default null,
  p_vat_number text default null
) returns public.organizations
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_org public.organizations;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.organizations (name, org_number, vat_number)
  values (p_name, p_org_number, p_vat_number)
  returning * into v_org;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org.id, v_user, 'owner');

  return v_org;
end $$;

revoke all on function create_organization(text, text, text) from public;
grant execute on function create_organization(text, text, text) to authenticated;
