-- Phase 2: Swedish invoice fields. Adds OCR reference, reverse VAT (omvänd
-- skattskyldighet), ROT/RUT deduction, our/their reference, order number,
-- payment terms, and per-line discount. Updates the totals trigger and
-- create_invoice RPC to keep server-side math the single source of truth.

alter table invoices
  add column ocr_reference     text,
  add column reverse_vat       boolean not null default false,
  add column rot_rut_type      text,
  add column rot_rut_cents     bigint not null default 0,
  add column our_reference     text,
  add column their_reference   text,
  add column order_number      text,
  add column payment_terms_days int,
  add constraint invoices_rot_rut_type_check
    check (rot_rut_type is null or rot_rut_type in ('ROT', 'RUT')),
  add constraint invoices_rot_rut_cents_nonneg check (rot_rut_cents >= 0);

alter table invoice_line_items
  add column discount_percent numeric(5,2) not null default 0,
  add constraint invoice_line_items_discount_range
    check (discount_percent >= 0 and discount_percent <= 100);

-- Swedish OCR payment reference: digits of the invoice number, left-padded to
-- 8, with a Luhn (mod-10) check digit appended. Mirrors the client-side
-- generateOcrReference in src/features/invoices/ocr.ts.
create or replace function faqtura_ocr(p_number text) returns text
language plpgsql immutable as $$
declare
  v_base text;
  v_sum int := 0;
  v_alt boolean := true;
  v_i int;
  v_d int;
  v_check int;
begin
  v_base := regexp_replace(coalesce(p_number, ''), '\D', '', 'g');
  if length(v_base) = 0 then
    return null;
  end if;
  v_base := lpad(v_base, 8, '0');
  for v_i in reverse length(v_base)..1 loop
    v_d := substr(v_base, v_i, 1)::int;
    if v_alt then
      v_d := v_d * 2;
      if v_d > 9 then
        v_d := (v_d % 10) + 1;
      end if;
    end if;
    v_sum := v_sum + v_d;
    v_alt := not v_alt;
  end loop;
  v_check := (10 - (v_sum % 10)) % 10;
  return v_base || v_check::text;
end $$;

-- Recompute totals accounting for reverse VAT (no VAT charged) and the ROT/RUT
-- deduction (reduces the amount due). reverse_vat / rot_rut_cents are set on the
-- invoice before line items are inserted, so this trigger reads them correctly
-- during create_invoice.
create or replace function recompute_invoice_totals() returns trigger
language plpgsql as $$
declare
  v_invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
  v_subtotal bigint;
  v_vat bigint;
  v_reverse boolean;
  v_rotrut bigint;
begin
  select
    coalesce(sum(amount_cents), 0),
    coalesce(sum(round(amount_cents * vat_rate / 100)), 0)
  into v_subtotal, v_vat
  from invoice_line_items
  where invoice_id = v_invoice_id;

  select reverse_vat, coalesce(rot_rut_cents, 0)
  into v_reverse, v_rotrut
  from invoices
  where id = v_invoice_id;

  if v_reverse then
    v_vat := 0;
  end if;

  update invoices
  set subtotal_cents = v_subtotal,
      vat_cents = v_vat,
      total_cents = v_subtotal + v_vat - v_rotrut
  where id = v_invoice_id;

  return null;
end $$;

-- create_invoice with the Phase 2 parameters. Appended after the existing ones
-- so named-argument call sites keep working. Drops the 0032 signature first.
drop function if exists create_invoice(uuid, uuid, date, text, text, jsonb, date, text);

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
  p_payment_terms_days int default null
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

  v_number := next_invoice_number(p_org);

  insert into invoices (
    organization_id, client_id, number, status, issued_at, due_at, currency, notes, template,
    ocr_reference, reverse_vat, rot_rut_type, rot_rut_cents,
    our_reference, their_reference, order_number, payment_terms_days
  )
  values (
    p_org, p_client_id, v_number, 'draft', v_issued_at, p_due_at, p_currency, p_notes, v_template,
    faqtura_ocr(v_number), coalesce(p_reverse_vat, false), v_rot_rut_type, coalesce(p_rot_rut_cents, 0),
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

revoke all on function create_invoice(
  uuid, uuid, date, text, text, jsonb, date, text,
  boolean, text, bigint, text, text, text, int
) from public;
grant execute on function create_invoice(
  uuid, uuid, date, text, text, jsonb, date, text,
  boolean, text, bigint, text, text, text, int
) to authenticated;
