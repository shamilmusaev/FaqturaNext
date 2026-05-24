create or replace function lock_sent_invoices() returns trigger
language plpgsql as $$
begin
  if old.status in ('sent','paid') then
    -- allow status transitions: sent → paid|cancelled|overdue, paid → cancelled
    if old.status = 'sent' and new.status in ('paid','cancelled','overdue') then
      return new;
    end if;
    if old.status = 'paid' and new.status = 'cancelled' then
      return new;
    end if;
    -- block all other modifications
    if new.status != old.status
       or new.client_id != old.client_id
       or new.issued_at != old.issued_at
       or new.due_at != old.due_at
       or coalesce(new.notes, '') != coalesce(old.notes, '')
       or new.subtotal_cents != old.subtotal_cents
       or new.vat_cents != old.vat_cents
       or new.total_cents != old.total_cents
    then
      raise exception 'cannot modify a % invoice', old.status;
    end if;
  end if;
  return new;
end $$;

create trigger invoices_lock_sent
  before update on invoices
  for each row execute function lock_sent_invoices();
