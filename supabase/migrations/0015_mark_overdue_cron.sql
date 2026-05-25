-- Daily job: flip 'sent' invoices past their due date to 'overdue', and log an event.
-- Runs at 03:00 UTC, idempotent (only affects rows that are still 'sent').

create extension if not exists pg_cron with schema extensions;

create or replace function mark_overdue_invoices() returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv record;
begin
  for v_inv in
    update invoices
       set status = 'overdue'
     where status = 'sent'
       and due_at < current_date
    returning id, organization_id
  loop
    insert into invoice_events (invoice_id, organization_id, type)
    values (v_inv.id, v_inv.organization_id, 'reminder_sent');
  end loop;
end $$;

-- Use 'reminder_sent' is wrong --- the flip itself is not a reminder. Drop the event log
-- inside the loop; we'll log a dedicated event type when we actually send reminders.
create or replace function mark_overdue_invoices() returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update invoices
     set status = 'overdue'
   where status = 'sent'
     and due_at < current_date;
end $$;

revoke all on function mark_overdue_invoices() from public;

-- Schedule daily 03:00 UTC. cron.schedule returns the job id; ignore if already scheduled.
select cron.schedule(
  'mark-overdue-invoices',
  '0 3 * * *',
  $$select public.mark_overdue_invoices();$$
)
where not exists (
  select 1 from cron.job where jobname = 'mark-overdue-invoices'
);
