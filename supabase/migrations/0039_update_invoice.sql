-- Update an existing DRAFT invoice in place: rewrite its header fields and
-- replace all line items. Totals recompute automatically via the
-- line_items_recompute_totals trigger (which reads reverse_vat / rot_rut_cents
-- from the invoice row, so those are updated BEFORE the line items are rewritten).
-- Only draft invoices may be edited.

create or replace function update_invoice(
  p_invoice_id uuid,
  p_client_id uuid,
  p_due_at date,
  p_currency text default 'SEK',
  p_notes text default null,
  p_line_items jsonb default '[]'::jsonb,
  p_issued_at date default null,
  p_template text default 'modern',
  p_reverse_vat boolean default false,
  p_rot_rut_type text default null,
  p_rot_rut_cents bigint default 0,
  p_our_reference text default null,
  p_their_reference text default null,
  p_order_number text default null,
  p_payment_terms_days int default null,
  p_number text default null,
  p_delivery_date date default null,
  p_hide_ocr boolean default false
) returns invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_status invoice_status;
  v_invoice invoices;
  v_item jsonb;
  v_position int := 1;
  v_quantity numeric;
  v_unit_price bigint;
  v_amount_cents bigint;
  v_vat_rate numeric;
  v_discount numeric;
  v_template text := coalesce(nullif(p_template, ''), 'modern');
  v_rot_rut_type text := nullif(p_rot_rut_type, '');
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select organization_id, status into v_org, v_status
  from invoices where id = p_invoice_id;
  if v_org is null then
    raise exception 'invoice not found';
  end if;
  if not exists (select 1 from memberships where organization_id = v_org and user_id = v_user) then
    raise exception 'not a member of organization %', v_org;
  end if;
  if v_status <> 'draft' then
    raise exception 'only draft invoices can be edited (status: %)', v_status;
  end if;
  if not exists (select 1 from clients where id = p_client_id and organization_id = v_org) then
    raise exception 'client not found in organization';
  end if;
  if jsonb_typeof(p_line_items) != 'array' or jsonb_array_length(p_line_items) < 1 then
    raise exception 'invoice must have at least one line item';
  end if;
  if v_rot_rut_type is not null and v_rot_rut_type not in ('ROT', 'RUT') then
    raise exception 'invalid rot_rut_type %; allowed: ROT, RUT', v_rot_rut_type;
  end if;
  if coalesce(p_rot_rut_cents, 0) < 0 then
    raise exception 'rot_rut_cents must be >= 0';
  end if;

  -- Header first so the recompute trigger sees the new reverse_vat / rot_rut.
  update invoices set
    client_id          = p_client_id,
    number             = coalesce(nullif(trim(p_number), ''), number),
    issued_at          = coalesce(p_issued_at, issued_at),
    due_at             = p_due_at,
    delivery_date      = p_delivery_date,
    currency           = p_currency,
    notes              = p_notes,
    template           = v_template,
    hide_ocr           = coalesce(p_hide_ocr, false),
    reverse_vat        = coalesce(p_reverse_vat, false),
    rot_rut_type       = v_rot_rut_type,
    rot_rut_cents      = coalesce(p_rot_rut_cents, 0),
    our_reference      = nullif(p_our_reference, ''),
    their_reference    = nullif(p_their_reference, ''),
    order_number       = nullif(p_order_number, ''),
    payment_terms_days = p_payment_terms_days,
    updated_at         = now()
  where id = p_invoice_id;

  delete from invoice_line_items where invoice_id = p_invoice_id;

  for v_item in select * from jsonb_array_elements(p_line_items)
  loop
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unit_price_cents')::bigint;
    v_vat_rate := coalesce((v_item->>'vat_rate')::numeric, 25);
    v_discount := coalesce((v_item->>'discount_percent')::numeric, 0);

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'line item quantity must be > 0 (got %)', v_quantity;
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      raise exception 'line item unit_price_cents must be >= 0 (got %)', v_unit_price;
    end if;
    if v_vat_rate not in (0, 6, 12, 25) then
      raise exception 'invalid VAT rate %; allowed: 0, 6, 12, 25', v_vat_rate;
    end if;
    if v_discount < 0 or v_discount > 100 then
      raise exception 'discount_percent must be within 0..100 (got %)', v_discount;
    end if;

    v_amount_cents := round(v_quantity * v_unit_price * (1 - v_discount / 100));

    insert into invoice_line_items (
      invoice_id, position, description, quantity, unit, unit_price_cents,
      vat_rate, amount_cents, discount_percent
    )
    values (
      p_invoice_id, v_position, v_item->>'description',
      v_quantity, v_item->>'unit', v_unit_price,
      v_vat_rate, v_amount_cents, v_discount
    );
    v_position := v_position + 1;
  end loop;

  select * into v_invoice from invoices where id = p_invoice_id;
  return v_invoice;
end $$;

revoke all on function update_invoice(
  uuid, uuid, date, text, text, jsonb, date, text,
  boolean, text, bigint, text, text, text, int, text, date, boolean
) from public;
grant execute on function update_invoice(
  uuid, uuid, date, text, text, jsonb, date, text,
  boolean, text, bigint, text, text, text, int, text, date, boolean
) to authenticated;
