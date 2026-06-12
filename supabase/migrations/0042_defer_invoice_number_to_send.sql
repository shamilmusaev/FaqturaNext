-- Assign the auto invoice number at SEND time, not at draft creation, so
-- abandoned drafts don't burn sequence numbers and the final (sent) invoice
-- numbering stays gapless (a Swedish bookkeeping requirement). Drafts have a
-- null number until sent (a manual override number is still honoured at create).

alter table invoices alter column number drop not null;

-- create_invoice: no longer pulls next_invoice_number; keeps only a manual
-- number if supplied, otherwise leaves number (and OCR) null.
create or replace function create_invoice(
  p_org uuid,
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
  v_number text;
  v_invoice invoices;
  v_item jsonb;
  v_position int := 1;
  v_quantity numeric;
  v_unit_price bigint;
  v_amount_cents bigint;
  v_vat_rate numeric;
  v_discount numeric;
  v_issued_at date := coalesce(p_issued_at, current_date);
  v_template text := coalesce(nullif(p_template, ''), 'modern');
  v_rot_rut_type text := nullif(p_rot_rut_type, '');
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from memberships where organization_id = p_org and user_id = v_user) then
    raise exception 'not a member of organization %', p_org;
  end if;
  if not exists (select 1 from clients where id = p_client_id and organization_id = p_org) then
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

  -- Manual number only; the auto sequence is consumed at send time.
  v_number := nullif(trim(p_number), '');

  insert into invoices (
    organization_id, client_id, number, status, issued_at, due_at, delivery_date, currency, notes, template,
    ocr_reference, hide_ocr, reverse_vat, rot_rut_type, rot_rut_cents,
    our_reference, their_reference, order_number, payment_terms_days
  )
  values (
    p_org, p_client_id, v_number, 'draft', v_issued_at, p_due_at, p_delivery_date, p_currency, p_notes, v_template,
    case when v_number is null then null else faqtura_ocr(v_number) end,
    coalesce(p_hide_ocr, false), coalesce(p_reverse_vat, false), v_rot_rut_type, coalesce(p_rot_rut_cents, 0),
    nullif(p_our_reference, ''), nullif(p_their_reference, ''), nullif(p_order_number, ''),
    p_payment_terms_days
  )
  returning * into v_invoice;

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
      v_invoice.id, v_position, v_item->>'description',
      v_quantity, v_item->>'unit', v_unit_price,
      v_vat_rate, v_amount_cents, v_discount
    );
    v_position := v_position + 1;
  end loop;

  insert into invoice_events (invoice_id, organization_id, type, actor_user_id)
  values (v_invoice.id, p_org, 'created', v_user);

  select * into v_invoice from invoices where id = v_invoice.id;
  return v_invoice;
end $$;

-- send_invoice: draft -> sent. Assigns the auto number + OCR if not already set
-- (manual number is kept). Row-locked so a double send can't take two numbers.
create or replace function send_invoice(p_invoice_id uuid) returns invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_status invoice_status;
  v_number text;
  v_invoice invoices;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select organization_id, status, number
    into v_org, v_status, v_number
  from invoices where id = p_invoice_id for update;

  if v_org is null then
    raise exception 'invoice not found';
  end if;
  if not exists (select 1 from memberships where organization_id = v_org and user_id = v_user) then
    raise exception 'not a member of organization %', v_org;
  end if;
  if v_status <> 'draft' then
    raise exception 'only draft invoices can be sent (status: %)', v_status;
  end if;

  if v_number is null then
    v_number := next_invoice_number(v_org);
  end if;

  update invoices set
    number        = v_number,
    ocr_reference = coalesce(ocr_reference, faqtura_ocr(v_number)),
    status        = 'sent',
    sent_at       = now()
  where id = p_invoice_id
  returning * into v_invoice;

  insert into invoice_events (invoice_id, organization_id, type, actor_user_id)
  values (p_invoice_id, v_org, 'sent', v_user);

  return v_invoice;
end $$;

revoke all on function send_invoice(uuid) from public;
grant execute on function send_invoice(uuid) to authenticated;
