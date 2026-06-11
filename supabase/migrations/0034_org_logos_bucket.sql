-- Storage bucket for organization logos (shown on invoice templates).
-- Public read; writes restricted to members of the org named by the first path
-- segment (objects are stored at "<organization_id>/<file>").

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

drop policy if exists "org logos public read" on storage.objects;
create policy "org logos public read"
  on storage.objects for select
  using (bucket_id = 'org-logos');

drop policy if exists "org members upload logos" on storage.objects;
create policy "org members upload logos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] in (
      select organization_id::text from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "org members update logos" on storage.objects;
create policy "org members update logos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] in (
      select organization_id::text from memberships where user_id = auth.uid()
    )
  );

drop policy if exists "org members delete logos" on storage.objects;
create policy "org members delete logos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] in (
      select organization_id::text from memberships where user_id = auth.uid()
    )
  );
