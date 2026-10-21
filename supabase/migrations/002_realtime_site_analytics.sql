create table if not exists public.site_pageviews (
  id uuid primary key,
  path text not null check (char_length(path) <= 512 and path ~ '^/[^?#]*$'),
  visited_at timestamptz not null default now()
);

create table if not exists public.site_analytics_realtime (
  id boolean primary key default true check (id),
  total_visits bigint not null default 0 check (total_visits >= 0),
  monthly_visits bigint not null default 0 check (monthly_visits >= 0),
  today_visits bigint not null default 0 check (today_visits >= 0),
  monthly_trend jsonb not null default '{}'::jsonb,
  stats_date date not null,
  stats_month date not null,
  stats_year integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists site_pageviews_visited_at_idx
  on public.site_pageviews (visited_at desc);

alter table public.site_pageviews enable row level security;
alter table public.site_analytics_realtime enable row level security;

revoke all on public.site_pageviews from public, anon, authenticated;
grant select on public.site_analytics_realtime to anon, authenticated;

drop policy if exists "public can read site analytics aggregate" on public.site_analytics_realtime;
create policy "public can read site analytics aggregate"
  on public.site_analytics_realtime
  for select
  to anon, authenticated
  using (true);

create or replace function public.record_site_pageview(p_event_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_local_now timestamp without time zone;
  v_visit_date date;
  v_visit_month date;
  v_visit_year integer;
  v_month_key text;
  v_inserted integer;
begin
  if p_event_id is null or p_path is null or char_length(p_path) > 512 or p_path !~ '^/[^?#]*$' then
    raise exception 'Invalid pageview event';
  end if;

  v_local_now := pg_catalog.timezone('Asia/Jakarta', pg_catalog.now());
  v_visit_date := v_local_now::date;
  v_visit_month := pg_catalog.date_trunc('month', v_local_now)::date;
  v_visit_year := extract(year from v_local_now)::integer;
  v_month_key := pg_catalog.to_char(v_local_now, 'MM');

  insert into public.site_pageviews (id, path)
  values (p_event_id, p_path)
  on conflict (id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return;
  end if;

  insert into public.site_analytics_realtime (
    id,
    total_visits,
    monthly_visits,
    today_visits,
    monthly_trend,
    stats_date,
    stats_month,
    stats_year
  ) values (
    true,
    1,
    1,
    1,
    pg_catalog.jsonb_build_object(v_month_key, 1),
    v_visit_date,
    v_visit_month,
    v_visit_year
  )
  on conflict (id) do update set
    total_visits = public.site_analytics_realtime.total_visits + 1,
    monthly_visits = case
      when public.site_analytics_realtime.stats_month = v_visit_month
        then public.site_analytics_realtime.monthly_visits + 1
      else 1
    end,
    today_visits = case
      when public.site_analytics_realtime.stats_date = v_visit_date
        then public.site_analytics_realtime.today_visits + 1
      else 1
    end,
    monthly_trend = case
      when public.site_analytics_realtime.stats_year <> v_visit_year
        then pg_catalog.jsonb_build_object(v_month_key, 1)
      else pg_catalog.jsonb_set(
        public.site_analytics_realtime.monthly_trend,
        array[v_month_key],
        pg_catalog.to_jsonb(
          coalesce(
            nullif(public.site_analytics_realtime.monthly_trend ->> v_month_key, '')::bigint,
            0
          ) + 1
        ),
        true
      )
    end,
    stats_date = v_visit_date,
    stats_month = v_visit_month,
    stats_year = v_visit_year,
    updated_at = pg_catalog.now();
end;
$$;

revoke all on function public.record_site_pageview(uuid, text) from public;
grant execute on function public.record_site_pageview(uuid, text) to anon, authenticated;

alter table public.site_analytics_realtime replica identity full;
do $$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'site_analytics_realtime'
    ) then
    alter publication supabase_realtime add table public.site_analytics_realtime;
  end if;
end;
$$;
