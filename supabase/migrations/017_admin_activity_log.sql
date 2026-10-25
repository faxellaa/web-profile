create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_title text not null,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_created_at_idx
  on public.admin_activity_log (created_at desc);

alter table public.admin_activity_log enable row level security;
revoke all on public.admin_activity_log from public, anon, authenticated;
grant select on public.admin_activity_log to authenticated;

drop policy if exists "school admins read activity log" on public.admin_activity_log;
create policy "school admins read activity log"
  on public.admin_activity_log
  for select
  to authenticated
  using ((select public.is_school_admin()));

create or replace function public.capture_school_admin_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_row jsonb;
  activity_title text;
  current_actor uuid;
begin
  current_actor := (select auth.uid());
  if current_actor is null or not (select public.is_school_admin()) then
    return null;
  end if;

  if tg_op = 'UPDATE' and to_jsonb(new) is not distinct from to_jsonb(old) then
    return null;
  end if;

  changed_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  activity_title := coalesce(
    nullif(changed_row ->> 'title', ''),
    nullif(changed_row ->> 'name', ''),
    nullif(changed_row ->> 'full_name', ''),
    nullif(changed_row ->> 'nickname', ''),
    tg_argv[0]
  );

  if tg_table_name = 'school_stats' then
    activity_title := tg_argv[0];
  elsif tg_table_name = 'school_gallery_items' then
    activity_title := concat(
      case when changed_row ->> 'media_type' = 'video' then 'Video YouTube: ' else 'Foto: ' end,
      activity_title
    );
  elsif tg_table_name = 'spmb_applications' then
    activity_title := concat('Status pendaftar: ', coalesce(changed_row ->> 'status', ''));
  end if;

  insert into public.admin_activity_log (action, entity_type, entity_title, actor_id)
  values (lower(tg_op), tg_argv[0], activity_title, current_actor);

  return null;
end;
$$;

revoke all on function public.capture_school_admin_activity() from public, anon, authenticated;

do $$
declare
  table_name text;
  entity_label text;
begin
  for table_name, entity_label in
    select *
    from (values
      ('articles', 'Prestasi'),
      ('teachers', 'Tenaga Kerja'),
      ('extracurriculars', 'Ekstrakurikuler'),
      ('facilities', 'Sarana & Prasarana'),
      ('school_gallery_items', 'Galeri Foto / Video'),
      ('school_stats', 'Sambutan Kepala Sekolah')
    ) as managed_tables(table_name, entity_label)
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop trigger if exists capture_school_admin_activity on public.%I', table_name);
      execute format(
        'create trigger capture_school_admin_activity after insert or update or delete on public.%I for each row execute function public.capture_school_admin_activity(%L)',
        table_name,
        entity_label
      );
    end if;
  end loop;

  if to_regclass('public.spmb_applications') is not null then
    execute 'drop trigger if exists capture_school_admin_activity on public.spmb_applications';
    execute 'create trigger capture_school_admin_activity after update of status on public.spmb_applications for each row execute function public.capture_school_admin_activity(''Status SPMB'')';
  end if;
end;
$$;
