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
        'create policy %I on public.%I for all to authenticated using (public.is_school_admin()) with check (public.is_school_admin())',
        'school admins manage ' || table_name,
        table_name
      );

      execute format('drop policy if exists %I on public.%I', 'school admin insert restriction ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I as restrictive for insert to public with check (public.is_school_admin())',
        'school admin insert restriction ' || table_name,
        table_name
      );
      execute format('drop policy if exists %I on public.%I', 'school admin update restriction ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I as restrictive for update to public using (public.is_school_admin()) with check (public.is_school_admin())',
        'school admin update restriction ' || table_name,
        table_name
      );
      execute format('drop policy if exists %I on public.%I', 'school admin delete restriction ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I as restrictive for delete to public using (public.is_school_admin())',
        'school admin delete restriction ' || table_name,
        table_name
      );
    end if;
  end loop;
end;
$$;

create table if not exists public.spmb_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  nickname text not null check (char_length(nickname) between 1 and 80),
  school_origin text not null default '' check (char_length(school_origin) <= 180),
  birth_place text not null check (char_length(birth_place) between 1 and 100),
  birth_date date not null,
  nik text not null check (nik ~ '^[0-9]{16}$'),
  snsps_document_path text,
  graduation_proof_path text,
  status text not null default 'Baru' check (status in ('Baru', 'Diverifikasi', 'Diterima')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spmb_applications_status_submitted_idx
  on public.spmb_applications (status, submitted_at desc);

alter table public.spmb_applications enable row level security;
revoke all on public.spmb_applications from public, anon, authenticated;
grant select, update (status, updated_at) on public.spmb_applications to authenticated;
grant all on public.spmb_applications to service_role;

drop policy if exists "school admins read SPMB applications" on public.spmb_applications;
create policy "school admins read SPMB applications"
  on public.spmb_applications
  for select
  to authenticated
  using (public.is_school_admin());

drop policy if exists "school admins update SPMB status" on public.spmb_applications;
create policy "school admins update SPMB status"
  on public.spmb_applications
  for update
  to authenticated
  using (public.is_school_admin())
  with check (
    public.is_school_admin()
    and status in ('Baru', 'Diverifikasi', 'Diterima')
  );

create table if not exists public.school_gallery_items (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('photo', 'video')),
  title text not null check (char_length(title) between 1 and 180),
  media_url text not null check (char_length(media_url) <= 2048),
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists school_gallery_items_type_order_idx
  on public.school_gallery_items (media_type, sort_order, created_at desc);

alter table public.school_gallery_items enable row level security;
revoke all on public.school_gallery_items from public, anon, authenticated;
grant select on public.school_gallery_items to anon, authenticated;
grant insert, update, delete on public.school_gallery_items to authenticated;

drop policy if exists "school gallery is publicly readable" on public.school_gallery_items;
create policy "school gallery is publicly readable"
  on public.school_gallery_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "school admins manage gallery" on public.school_gallery_items;
create policy "school admins manage gallery"
  on public.school_gallery_items
  for all
  to authenticated
  using (public.is_school_admin())
  with check (public.is_school_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spmb-documents',
  'spmb-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "SPMB documents are restricted to school admins" on storage.objects;
create policy "SPMB documents are restricted to school admins"
  on storage.objects
  as restrictive
  for all
  to public
  using (bucket_id <> 'spmb-documents' or public.is_school_admin())
  with check (bucket_id <> 'spmb-documents' or public.is_school_admin());

drop policy if exists "school admins manage SPMB documents" on storage.objects;
create policy "school admins manage SPMB documents"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'spmb-documents' and public.is_school_admin())
  with check (bucket_id = 'spmb-documents' and public.is_school_admin());
