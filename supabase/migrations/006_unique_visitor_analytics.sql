begin;

create table if not exists public.site_visitors (
  visitor_id uuid primary key,
  first_seen_at timestamptz not null default pg_catalog.now()
);

create table if not exists public.site_visitor_days (
  visitor_id uuid not null references public.site_visitors (visitor_id) on delete cascade,
  visited_on date not null,
  primary key (visitor_id, visited_on)
);

create index if not exists site_visitor_days_visited_on_visitor_id_idx
  on public.site_visitor_days (visited_on, visitor_id);

alter table public.site_visitors enable row level security;
alter table public.site_visitor_days enable row level security;

revoke all on public.site_visitors, public.site_visitor_days from public, anon, authenticated;

drop function if exists public.record_site_pageview(uuid, text);

do $$
declare
  v_local_now timestamp without time zone := pg_catalog.timezone('Asia/Jakarta', pg_catalog.now());
begin
  if not exists (select 1 from public.site_visitors limit 1) then
    delete from public.site_pageviews;

    update public.site_analytics_realtime
    set
      total_visits = 0,
      monthly_visits = 0,
      today_visits = 0,
      monthly_trend = '{}'::jsonb,
      stats_date = v_local_now::date,
      stats_month = pg_catalog.date_trunc('month', v_local_now)::date,
      stats_year = extract(year from v_local_now)::integer,
      updated_at = pg_catalog.now()
    where id = true;
  end if;
end;
$$;

create or replace function public.record_site_pageview(
  p_event_id uuid,
  p_path text,
  p_visitor_id uuid
)
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
  v_event_inserted integer;
  v_new_visitor integer;
  v_new_daily_visitor integer;
begin
  if p_event_id is null
    or p_visitor_id is null
    or p_path is null
    or char_length(p_path) > 512
    or p_path !~ '^/[^?#]*$' then
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

  get diagnostics v_event_inserted = row_count;
  if v_event_inserted = 0 then
    return;
  end if;

  insert into public.site_visitors (visitor_id)
  values (p_visitor_id)
  on conflict (visitor_id) do nothing;

  get diagnostics v_new_visitor = row_count;

  insert into public.site_visitor_days (visitor_id, visited_on)
  values (p_visitor_id, v_visit_date)
  on conflict (visitor_id, visited_on) do nothing;

  get diagnostics v_new_daily_visitor = row_count;
  if v_new_daily_visitor = 0 then
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
    v_new_visitor,
    1,
    1,
    pg_catalog.jsonb_build_object(v_month_key, 1),
    v_visit_date,
    v_visit_month,
    v_visit_year
  )
  on conflict (id) do update set
    total_visits = public.site_analytics_realtime.total_visits + v_new_visitor,
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

revoke all on function public.record_site_pageview(uuid, text, uuid) from public;
grant execute on function public.record_site_pageview(uuid, text, uuid) to anon, authenticated;

create or replace function public.get_site_weekly_visits()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with date_range as (
    select pg_catalog.timezone('Asia/Jakarta', pg_catalog.now())::date as today
  ),
  recent_visitors as (
    select visitor.visitor_id, visitor.visited_on
    from public.site_visitor_days as visitor
    cross join date_range
    where visitor.visited_on >= date_range.today - 6
      and visitor.visited_on <= date_range.today
  ),
  daily_counts as (
    select visitor.visited_on, pg_catalog.count(*) as visitor_count
    from recent_visitors as visitor
    group by visitor.visited_on
  )
  select pg_catalog.jsonb_build_object(
    'daily',
    coalesce(
      (
        select pg_catalog.jsonb_object_agg(
          pg_catalog.to_char(daily.visited_on, 'YYYY-MM-DD'),
          daily.visitor_count
        )
        from daily_counts as daily
      ),
      '{}'::jsonb
    ),
    'unique_visitors',
    (select pg_catalog.count(distinct visitor_id) from recent_visitors)
  );
$$;

revoke all on function public.get_site_weekly_visits() from public;
grant execute on function public.get_site_weekly_visits() to anon, authenticated;

notify pgrst, 'reload schema';

commit;
