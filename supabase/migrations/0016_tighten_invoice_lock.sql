create or replace function lock_sent_invoices() returns trigger
language plpgsql as $$
declare
  v_allowed boolean;
begin
  if old.status = 'draft' then
    -- drafts are freely editable; allowed transitions: draft -> sent or draft -> cancelled
    if new.status not in ('draft', 'sent', 'cancelled') then
      raise exception 'invalid status transition draft -> %', new.status;
    end if;
    return new;
  end if;

  -- Beyond draft, the invoice is locked.
  v_allowed := false;
  if old.status = 'sent' and new.status in ('sent', 'paid', 'overdue', 'cancelled') then
    v_allowed := true;
  elsif old.status = 'overdue' and new.status in ('overdue', 'paid', 'cancelled') then
    v_allowed := true;
  elsif old.status in ('paid', 'cancelled') and new.status = old.status then
    v_allowed := true; -- no-op update is OK (e.g. revalidations)
  end if;

  if not v_allowed then
    raise exception 'invalid status transition % -> %', old.status, new.status;
  end if;

  -- Even on allowed status transitions, ALL other fields must be unchanged.
  -- Allow updating paid_at when transitioning into paid, sent_at when transitioning into sent.
  if new.client_id != old.client_id
     or new.number != old.number
     or new.issued_at != old.issued_at
     or new.due_at != old.due_at
     or coalesce(new.notes, '') != coalesce(old.notes, '')
     or new.subtotal_cents != old.subtotal_cents
     or new.vat_cents != old.vat_cents
     or new.total_cents != old.total_cents
     or new.currency != old.currency
  then
    raise exception 'cannot modify fields on locked invoice (status=%)', old.status;
  end if;

  return new;
end $$;
