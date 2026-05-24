create or replace function next_invoice_number(p_org uuid) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from current_date)::int;
  v_value int;
  v_template text;
begin
  -- verify caller is a member of the org
  if not exists (
    select 1 from memberships
    where organization_id = p_org and user_id = auth.uid()
  ) then
    raise exception 'not a member of organization %', p_org;
  end if;

  insert into invoice_number_sequences (organization_id, year, last_value)
  values (p_org, v_year, 1)
  on conflict (organization_id, year)
  do update set last_value = invoice_number_sequences.last_value + 1
  returning last_value into v_value;

  select invoice_number_template into v_template
  from organizations where id = p_org;

  return replace(
    replace(coalesce(v_template, 'INV-{YYYY}-{NNNN}'), '{YYYY}', v_year::text),
    '{NNNN}', lpad(v_value::text, 4, '0')
  );
end $$;

revoke all on function next_invoice_number(uuid) from public;
grant execute on function next_invoice_number(uuid) to authenticated;
