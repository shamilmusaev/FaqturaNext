create or replace function lock_sent_invoices() returns trigger
language plpgsql as $$
declare
  v_allowed boolean;
begin
  if old.status = 'draft' then
    if new.status not in ('draft', 'sent', 'cancelled') then
      raise exception 'invalid status transition draft -> %', new.status;
    end if;
    -- timestamps must not be set ahead of their transition
    if new.sent_at is distinct from old.sent_at and new.status != 'sent' then
      raise exception 'sent_at can only be set when transitioning to sent';
    end if;
    if new.paid_at is distinct from old.paid_at then
      raise exception 'paid_at can only be set when transitioning to paid';
    end if;
    return new;
  end if;

  v_allowed := false;
  if old.status = 'sent' and new.status in ('sent', 'paid', 'overdue', 'cancelled') then
    v_allowed := true;
  elsif old.status = 'overdue' and new.status in ('overdue', 'paid', 'cancelled') then
    v_allowed := true;
  elsif old.status in ('paid', 'cancelled') and new.status = old.status then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'invalid status transition % -> %', old.status, new.status;
  end if;

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

  -- sent_at can only be (a) unchanged or (b) set when transitioning into sent
  if new.sent_at is distinct from old.sent_at then
    if not (old.status = 'draft' and new.status = 'sent') then
      raise exception 'sent_at can only be set when transitioning from draft to sent';
    end if;
  end if;

  -- paid_at can only be (a) unchanged or (b) set when transitioning into paid
  if new.paid_at is distinct from old.paid_at then
    if not (old.status in ('sent','overdue') and new.status = 'paid') then
      raise exception 'paid_at can only be set when transitioning to paid';
    end if;
  end if;

  return new;
end $$;
