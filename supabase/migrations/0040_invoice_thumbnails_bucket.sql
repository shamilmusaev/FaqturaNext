-- Private storage bucket caching rendered PNG thumbnails of invoice PDFs (first
-- page), shown in the invoices "cards" view. Private: served only through the
-- authenticated /api/invoices/[id]/thumbnail route. Objects live at
-- "<organization_id>/<invoice_id>-<version>.png".

insert into storage.buckets (id, name, public)
values ('invoice-thumbnails', 'invoice-thumbnails', false)
on conflict (id) do nothing;

drop policy if exists "org members read thumbnails" on storage.objects;
create policy "org members read thumbnails"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoice-thumbnails'
    and (storage.foldername(name))[1] in (
      select organization_id::text from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "org members upload thumbnails" on storage.objects;
create policy "org members upload thumbnails"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoice-thumbnails'
    and (storage.foldername(name))[1] in (
      select organization_id::text from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "org members update thumbnails" on storage.objects;
create policy "org members update thumbnails"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'invoice-thumbnails'
    and (storage.foldername(name))[1] in (
      select organization_id::text from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "org members delete thumbnails" on storage.objects;
create policy "org members delete thumbnails"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'invoice-thumbnails'
    and (storage.foldername(name))[1] in (
      select organization_id::text from memberships where user_id = auth.uid()
    )
  );
