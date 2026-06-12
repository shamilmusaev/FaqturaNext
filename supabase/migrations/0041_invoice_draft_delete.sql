-- Allow deleting DRAFT invoices only. Issued invoices (sent/paid/overdue/
-- cancelled) remain non-deletable financial documents — they are cancelled, not
-- removed. Child rows (line items, events) are removed via ON DELETE CASCADE.

drop policy if exists "members delete draft invoices" on invoices;
create policy "members delete draft invoices"
  on invoices for delete to authenticated
  using (
    status = 'draft'
    and organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );
