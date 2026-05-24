create or replace function create_invoice(
  p_org uuid,
  p_client_id uuid,
  p_due_at date,
  p_currency text default 'SEK',
  p_notes text default null,
  p_line_items jsonb default '[]'::jsonb
) returns invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_number text;
  v_invoice invoices;
  v_item jsonb;
  v_position int := 1;
  v_amount_cents bigint;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from memberships
    where organization_id = p_org and user_id = v_user
  ) then
    raise exception 'not a member of organization %', p_org;
  end if;

  -- verify client belongs to the org
  if not exists (
    select 1 from clients
    where id = p_client_id and organization_id = p_org
  ) then
    raise exception 'client not found in organization';
  end if;

  v_number := next_invoice_number(p_org);

  insert into invoices (organization_id, client_id, number, status, due_at, currency, notes)
  values (p_org, p_client_id, v_number, 'draft', p_due_at, p_currency, p_notes)
  returning * into v_invoice;

  -- insert line items
  for v_item in select * from jsonb_array_elements(p_line_items)
  loop
    v_amount_cents := round(
      (v_item->>'quantity')::numeric * (v_item->>'unit_price_cents')::bigint
    );
    insert into invoice_line_items (
      invoice_id, position, description, quantity, unit,
      unit_price_cents, vat_rate, amount_cents
    ) values (
      v_invoice.id,
      v_position,
      v_item->>'description',
      (v_item->>'quantity')::numeric,
      v_item->>'unit',
      (v_item->>'unit_price_cents')::bigint,
      coalesce((v_item->>'vat_rate')::numeric, 25),
      v_amount_cents
    );
    v_position := v_position + 1;
  end loop;

  -- log creation event
  insert into invoice_events (invoice_id, organization_id, type, actor_user_id)
  values (v_invoice.id, p_org, 'created', v_user);

  -- reload invoice with computed totals (triggered by line item inserts)
  select * into v_invoice from invoices where id = v_invoice.id;
  return v_invoice;
end $$;

revoke all on function create_invoice(uuid, uuid, date, text, text, jsonb) from public;
grant execute on function create_invoice(uuid, uuid, date, text, text, jsonb) to authenticated;
