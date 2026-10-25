grant delete on table public.spmb_applications to authenticated;

drop policy if exists "school admins delete SPMB applications without WhatsApp"
  on public.spmb_applications;

create policy "school admins delete SPMB applications without WhatsApp"
  on public.spmb_applications
  for delete
  to authenticated
  using (
    public.is_school_admin()
    and guardian_whatsapp is null
  );
