create or replace function public.is_school_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

grant execute on function public.is_school_admin() to anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['articles', 'teachers', 'extracurriculars', 'facilities', 'school_stats'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke insert, update, delete on table public.%I from public, anon', table_name);
      execute format('grant insert, update, delete on table public.%I to authenticated', table_name);

      execute format('drop policy if exists %I on public.%I', 'school admins manage ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I for all to authenticated using ((select public.is_school_admin())) with check ((select public.is_school_admin()))',
        'school admins manage ' || table_name,
        table_name
      );

      execute format('drop policy if exists %I on public.%I', 'school admin insert restriction ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I as restrictive for insert to public with check ((select public.is_school_admin()))',
        'school admin insert restriction ' || table_name,
        table_name
      );
      execute format('drop policy if exists %I on public.%I', 'school admin update restriction ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I as restrictive for update to public using ((select public.is_school_admin())) with check ((select public.is_school_admin()))',
        'school admin update restriction ' || table_name,
        table_name
      );
      execute format('drop policy if exists %I on public.%I', 'school admin delete restriction ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I as restrictive for delete to public using ((select public.is_school_admin()))',
        'school admin delete restriction ' || table_name,
        table_name
      );
    end if;
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'school-media',
  'school-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "school media public read" on storage.objects;
create policy "school media public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'school-media');

drop policy if exists "school admins manage school media" on storage.objects;
create policy "school admins manage school media"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'school-media' and (select public.is_school_admin()))
  with check (bucket_id = 'school-media' and (select public.is_school_admin()));

drop policy if exists "school media insert admin restriction" on storage.objects;
create policy "school media insert admin restriction"
  on storage.objects
  as restrictive
  for insert
  to public
  with check (bucket_id <> 'school-media' or (select public.is_school_admin()));

drop policy if exists "school media update admin restriction" on storage.objects;
create policy "school media update admin restriction"
  on storage.objects
  as restrictive
  for update
  to public
  using (bucket_id <> 'school-media' or (select public.is_school_admin()))
  with check (bucket_id <> 'school-media' or (select public.is_school_admin()));

drop policy if exists "school media delete admin restriction" on storage.objects;
create policy "school media delete admin restriction"
  on storage.objects
  as restrictive
  for delete
  to public
  using (bucket_id <> 'school-media' or (select public.is_school_admin()));
