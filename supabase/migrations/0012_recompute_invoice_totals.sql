create or replace function recompute_invoice_totals() returns trigger
language plpgsql as $$
declare
  v_invoice_id uuid := coalesce(new.invoice_id, old.invoice_id);
  v_subtotal bigint;
  v_vat bigint;
begin
  select
    coalesce(sum(amount_cents), 0),
    coalesce(sum(round(amount_cents * vat_rate / 100)), 0)
  into v_subtotal, v_vat
  from invoice_line_items
  where invoice_id = v_invoice_id;

  update invoices
  set subtotal_cents = v_subtotal,
      vat_cents = v_vat,
      total_cents = v_subtotal + v_vat
  where id = v_invoice_id;

  return null;
end $$;

create trigger line_items_recompute_totals
  after insert or update or delete on invoice_line_items
  for each row execute function recompute_invoice_totals();
