alter table invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table invoice_events enable row level security;
alter table invoice_number_sequences enable row level security;

-- invoices: org members read; members write/update
create policy "members read org invoices"
  on invoices for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members insert org invoices"
  on invoices for insert with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "members update org invoices"
  on invoices for update
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

-- No delete policy — invoices are financial documents, only cancellable.

-- invoice_line_items: scoped through parent invoice
create policy "members read org line items"
  on invoice_line_items for select
  using (invoice_id in (
    select id from invoices
    where organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  ));

create policy "members write org line items"
  on invoice_line_items for all
  using (invoice_id in (
    select id from invoices
    where organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  ))
  with check (invoice_id in (
    select id from invoices
    where organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  ));

-- invoice_events: org-scoped, append-only (no update/delete policy)
create policy "members read org events"
  on invoice_events for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));

create policy "members insert org events"
  on invoice_events for insert with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

-- invoice_number_sequences: read-only for members; RPC mutates via security definer
create policy "members read org sequences"
  on invoice_number_sequences for select
  using (organization_id in (
    select organization_id from memberships where user_id = auth.uid()
  ));
