alter table public.spmb_applications
  add column if not exists guardian_whatsapp text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'spmb_applications_guardian_whatsapp_format'
      and conrelid = 'public.spmb_applications'::regclass
  ) then
    alter table public.spmb_applications
      add constraint spmb_applications_guardian_whatsapp_format
      check (guardian_whatsapp is null or guardian_whatsapp ~ '^62[0-9]{8,13}$');
  end if;
end;
$$;
