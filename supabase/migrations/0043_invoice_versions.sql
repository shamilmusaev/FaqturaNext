-- Invoice versioning: snapshot every draft save so the user can see history,
-- compare diffs, and restore / duplicate from any past version.

create table invoice_versions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  version_number int not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  -- Full snapshot of the invoice + line_items at this point in time.
  snapshot jsonb not null,
  -- md5(snapshot) for deduplication (skip duplicate autosaves).
  snapshot_hash text not null,
  unique (invoice_id, version_number)
);

create index idx_versions_invoice on invoice_versions(invoice_id, version_number desc);
create index idx_versions_org on invoice_versions(organization_id, created_at desc);

alter table invoice_versions enable row level security;

create policy invoice_versions_org on invoice_versions
  for all
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

-- Save a version snapshot for the given invoice.  Rate-limited (30 s) and
-- deduplicated (same hash as the latest version → skipped).  Returns the
-- saved row or null when skipped.
create or replace function save_invoice_version(p_invoice_id uuid)
returns invoice_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_status invoice_status;
  v_last_hash text;
  v_last_number int;
  v_version invoice_versions;
  v_invoice jsonb;
  v_line_items jsonb;
  v_snapshot jsonb;
  v_hash text;
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
  -- Only draft invoices keep versions (sent/paid/overdue/cancelled are immutable).
  if v_status <> 'draft' then
    return null;
  end if;

  -- Rate limit: skip if a version was created less than 30 s ago.
  if exists (
    select 1 from invoice_versions
    where invoice_id = p_invoice_id
      and created_at > now() - interval '30 seconds'
  ) then
    return null;
  end if;

  -- Build the snapshot.
  select jsonb_build_object(
    'client_id', client_id,
    'number', number,
    'issued_at', issued_at,
    'due_at', due_at,
    'delivery_date', delivery_date,
    'currency', currency,
    'notes', notes,
    'template', template,
    'hide_ocr', hide_ocr,
    'reverse_vat', reverse_vat,
    'rot_rut_type', rot_rut_type,
    'rot_rut_cents', rot_rut_cents,
    'our_reference', our_reference,
    'their_reference', their_reference,
    'order_number', order_number,
    'payment_terms_days', payment_terms_days,
    'subtotal_cents', subtotal_cents,
    'vat_cents', vat_cents,
    'total_cents', total_cents
  ) into v_invoice
  from invoices where id = p_invoice_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'description', description,
      'quantity', quantity,
      'unit', unit,
      'unit_price_cents', unit_price_cents,
      'vat_rate', vat_rate,
      'discount_percent', discount_percent,
      'amount_cents', amount_cents
    ) order by position
  ), '[]'::jsonb) into v_line_items
  from invoice_line_items where invoice_id = p_invoice_id;

  v_snapshot := jsonb_build_object(
    'header', v_invoice,
    'lineItems', v_line_items
  );
  v_hash := md5(v_snapshot::text);

  -- Deduplication: skip if the snapshot is identical to the latest version.
  select snapshot_hash, version_number into v_last_hash, v_last_number
  from invoice_versions
  where invoice_id = p_invoice_id
  order by version_number desc
  limit 1;

  if v_last_hash = v_hash then
    return null;
  end if;

  insert into invoice_versions (
    invoice_id, organization_id, version_number, created_by,
    snapshot, snapshot_hash
  )
  values (
    p_invoice_id, v_org, coalesce(v_last_number, 0) + 1, v_user,
    v_snapshot, v_hash
  )
  returning * into v_version;

  return v_version;
end $$;

revoke all on function save_invoice_version(uuid) from public;
grant execute on function save_invoice_version(uuid) to authenticated;

-- Create a new draft invoice from a version snapshot.
create or replace function create_invoice_from_version(
  p_version_id uuid,
  p_org uuid
) returns invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_version invoice_versions;
  v_header jsonb;
  v_line_items jsonb;
  v_item jsonb;
  v_invoice invoices;
  v_position int := 1;
  v_client_id uuid;
  v_quantity numeric;
  v_unit_price bigint;
  v_vat_rate numeric;
  v_discount numeric;
  v_amount_cents bigint;
  v_template text;
  v_rot_rut_type text;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select * into v_version
  from invoice_versions
  where id = p_version_id;
  if v_version is null then
    raise exception 'version not found';
  end if;

  v_org := v_version.organization_id;
  if not exists (select 1 from memberships where organization_id = v_org and user_id = v_user) then
    raise exception 'not a member of organization %', v_org;
  end if;

  v_header := v_version.snapshot->'header';
  v_line_items := v_version.snapshot->'lineItems';
  v_client_id := (v_header->>'client_id')::uuid;

  if not exists (select 1 from clients where id = v_client_id and organization_id = v_org) then
    raise exception 'client not found in organization';
  end if;
  if jsonb_typeof(v_line_items) != 'array' or jsonb_array_length(v_line_items) < 1 then
    raise exception 'version must have at least one line item';
  end if;

  v_template := coalesce(nullif(v_header->>'template', ''), 'modern');
  v_rot_rut_type := nullif(v_header->>'rot_rut_type', '');
  if v_rot_rut_type is not null and v_rot_rut_type not in ('ROT', 'RUT') then
    v_rot_rut_type := null;
  end if;

  insert into invoices (
    organization_id, client_id, status, issued_at, due_at, delivery_date,
    currency, notes, template, hide_ocr, reverse_vat, rot_rut_type, rot_rut_cents,
    our_reference, their_reference, order_number, payment_terms_days
  )
  values (
    v_org, v_client_id, 'draft',
    coalesce((v_header->>'issued_at')::date, current_date),
    coalesce((v_header->>'due_at')::date, current_date + 30),
    nullif(v_header->>'delivery_date', ''),
    coalesce(nullif(v_header->>'currency', ''), 'SEK'),
    nullif(v_header->>'notes', ''),
    v_template,
    coalesce((v_header->>'hide_ocr')::boolean, false),
    coalesce((v_header->>'reverse_vat')::boolean, false),
    v_rot_rut_type,
    coalesce((v_header->>'rot_rut_cents')::bigint, 0),
    nullif(v_header->>'our_reference', ''),
    nullif(v_header->>'their_reference', ''),
    nullif(v_header->>'order_number', ''),
    nullif(v_header->>'payment_terms_days', '')::int
  )
  returning * into v_invoice;

  for v_item in select * from jsonb_array_elements(v_line_items)
  loop
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unit_price_cents')::bigint;
    v_vat_rate := coalesce((v_item->>'vat_rate')::numeric, 25);
    v_discount := coalesce((v_item->>'discount_percent')::numeric, 0);

    if v_quantity is null or v_quantity <= 0 then
      v_quantity := 1;
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      v_unit_price := 0;
    end if;
    if v_vat_rate not in (0, 6, 12, 25) then
      v_vat_rate := 25;
    end if;
    if v_discount < 0 or v_discount > 100 then
      v_discount := 0;
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
  values (v_invoice.id, v_org, 'created', v_user);

  select * into v_invoice from invoices where id = v_invoice.id;
  return v_invoice;
end $$;

revoke all on function create_invoice_from_version(uuid, uuid) from public;
grant execute on function create_invoice_from_version(uuid, uuid) to authenticated;

-- Wire version saving into the existing update_invoice RPC so every draft
-- autosave automatically creates a snapshot (rate-limited + deduplicated).
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

  -- Persist a version snapshot (rate-limited + deduplicated).
  perform save_invoice_version(p_invoice_id);

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
