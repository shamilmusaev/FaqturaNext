-- Add a free-form bank name to organizations (shown on the invoice next to the
-- payment details) and thread it through the update_organization RPC.

alter table organizations add column bank_name text;

create or replace function update_organization(
  p_org_id uuid,
  p_name text default null,
  p_org_number text default null,
  p_vat_number text default null,
  p_address jsonb default null,
  p_iban text default null,
  p_bankgiro text default null,
  p_plusgiro text default null,
  p_swish_number text default null,
  p_default_vat_rate numeric default null,
  p_default_payment_terms_days int default null,
  p_locale text default null,
  p_currency text default null,
  p_invoice_number_template text default null,
  p_logo_url text default null,
  p_bank_name text default null
) returns organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_org organizations;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select role into v_role
  from memberships
  where organization_id = p_org_id and user_id = v_user;

  if v_role is null then
    raise exception 'not a member of this organization';
  end if;
  if v_role not in ('owner', 'admin') then
    raise exception 'insufficient role';
  end if;

  update organizations set
    name                    = coalesce(p_name, name),
    org_number              = coalesce(p_org_number, org_number),
    vat_number              = coalesce(p_vat_number, vat_number),
    address                 = coalesce(p_address, address),
    iban                    = coalesce(p_iban, iban),
    bankgiro                = coalesce(p_bankgiro, bankgiro),
    plusgiro                = coalesce(p_plusgiro, plusgiro),
    swish_number            = coalesce(p_swish_number, swish_number),
    bank_name               = coalesce(p_bank_name, bank_name),
    default_vat_rate        = coalesce(p_default_vat_rate, default_vat_rate),
    default_payment_terms_days = coalesce(p_default_payment_terms_days, default_payment_terms_days),
    locale                  = coalesce(p_locale, locale),
    currency                = coalesce(p_currency, currency),
    invoice_number_template = coalesce(p_invoice_number_template, invoice_number_template),
    logo_url                = coalesce(p_logo_url, logo_url)
  where id = p_org_id
  returning * into v_org;

  return v_org;
end $$;

revoke all on function update_organization(
  uuid, text, text, text, jsonb, text, text, text, text,
  numeric, int, text, text, text, text, text
) from public;

grant execute on function update_organization(
  uuid, text, text, text, jsonb, text, text, text, text,
  numeric, int, text, text, text, text, text
) to authenticated;
