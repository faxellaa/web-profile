create or replace function public.get_site_weekly_visits()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_object_agg(
      pg_catalog.to_char(daily.visited_on, 'YYYY-MM-DD'),
      daily.visit_count
    ),
    '{}'::jsonb
  )
  from (
    select
      (pageview.visited_at at time zone 'Asia/Jakarta')::date as visited_on,
      pg_catalog.count(*) as visit_count
    from public.site_pageviews as pageview
    where pageview.visited_at >= (
      (pg_catalog.timezone('Asia/Jakarta', pg_catalog.now())::date - 6)::timestamp
      at time zone 'Asia/Jakarta'
    )
      and pageview.visited_at < (
        (pg_catalog.timezone('Asia/Jakarta', pg_catalog.now())::date + 1)::timestamp
        at time zone 'Asia/Jakarta'
      )
    group by (pageview.visited_at at time zone 'Asia/Jakarta')::date
  ) as daily;
$$;

revoke all on function public.get_site_weekly_visits() from public;
grant execute on function public.get_site_weekly_visits() to anon, authenticated;
