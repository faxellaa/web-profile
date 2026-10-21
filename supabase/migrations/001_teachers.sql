create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  role text not null default 'Guru',
  photo_url text,
  photo_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teachers_sort_order_idx on public.teachers (sort_order, name);

alter table public.teachers enable row level security;

create policy "teachers are publicly readable"
  on public.teachers for select
  to anon, authenticated
  using (true);

create policy "authenticated users manage teachers"
  on public.teachers for all
  to authenticated
  using (true)
  with check (true);
