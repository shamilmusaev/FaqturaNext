drop policy if exists "members write org line items" on invoice_line_items;

-- Read remains broad (members of org).
-- Writes (insert/update/delete) only allowed when parent invoice status='draft'.
create policy "members insert draft line items"
  on invoice_line_items for insert with check (
    invoice_id in (
      select id from invoices
      where status = 'draft'
        and organization_id in (
          select organization_id from memberships where user_id = auth.uid()
        )
    )
  );

create policy "members update draft line items"
  on invoice_line_items for update
  using (
    invoice_id in (
      select id from invoices
      where status = 'draft'
        and organization_id in (
          select organization_id from memberships where user_id = auth.uid()
        )
    )
  )
  with check (
    invoice_id in (
      select id from invoices
      where status = 'draft'
        and organization_id in (
          select organization_id from memberships where user_id = auth.uid()
        )
    )
  );

create policy "members delete draft line items"
  on invoice_line_items for delete
  using (
    invoice_id in (
      select id from invoices
      where status = 'draft'
        and organization_id in (
          select organization_id from memberships where user_id = auth.uid()
        )
    )
  );
