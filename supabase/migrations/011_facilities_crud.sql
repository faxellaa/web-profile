create or replace function public.is_school_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

grant execute on function public.is_school_admin() to anon, authenticated;

alter table public.facilities
  add column if not exists image_path text;

alter table public.facilities enable row level security;

revoke insert, update, delete on table public.facilities from public, anon;
grant select on table public.facilities to anon, authenticated;
grant insert, update, delete on table public.facilities to authenticated;

drop policy if exists "facilities are publicly readable" on public.facilities;
create policy "facilities are publicly readable"
  on public.facilities
  for select
  to anon, authenticated
  using (true);

drop policy if exists "school admins manage facilities" on public.facilities;
create policy "school admins manage facilities"
  on public.facilities
  for all
  to authenticated
  using ((select public.is_school_admin()))
  with check ((select public.is_school_admin()));

drop policy if exists "school admin insert restriction facilities" on public.facilities;
create policy "school admin insert restriction facilities"
  on public.facilities
  as restrictive
  for insert
  to public
  with check ((select public.is_school_admin()));

drop policy if exists "school admin update restriction facilities" on public.facilities;
create policy "school admin update restriction facilities"
  on public.facilities
  as restrictive
  for update
  to public
  using ((select public.is_school_admin()))
  with check ((select public.is_school_admin()));

drop policy if exists "school admin delete restriction facilities" on public.facilities;
create policy "school admin delete restriction facilities"
  on public.facilities
  as restrictive
  for delete
  to public
  using ((select public.is_school_admin()));
