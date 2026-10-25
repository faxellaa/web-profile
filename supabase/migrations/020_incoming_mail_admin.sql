create table if not exists public.incoming_letters (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null check (char_length(sender_name) between 1 and 120),
  institution text not null default '' check (char_length(institution) <= 160),
  contact text not null check (char_length(contact) between 1 and 160),
  letter_number text not null default '' check (char_length(letter_number) <= 100),
  letter_date date,
  recipient text not null default '' check (char_length(recipient) <= 120),
  subject text not null check (char_length(subject) between 1 and 200),
  summary text not null check (char_length(summary) between 1 and 5000),
  attachment_path text,
  attachment_name text check (attachment_name is null or char_length(attachment_name) <= 255),
  status text not null default 'Baru' check (status in ('Baru', 'Diproses', 'Selesai')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incoming_letters_submitted_at_idx
  on public.incoming_letters (submitted_at desc);

create index if not exists incoming_letters_status_submitted_idx
  on public.incoming_letters (status, submitted_at desc);

alter table public.incoming_letters enable row level security;
revoke all on public.incoming_letters from public, anon, authenticated;
grant select, update (status, updated_at) on public.incoming_letters to authenticated;
grant all on public.incoming_letters to service_role;

drop policy if exists "school admins read incoming letters" on public.incoming_letters;
create policy "school admins read incoming letters"
  on public.incoming_letters
  for select
  to authenticated
  using (public.is_school_admin());

drop policy if exists "school admins update incoming letter status" on public.incoming_letters;
create policy "school admins update incoming letter status"
  on public.incoming_letters
  for update
  to authenticated
  using (public.is_school_admin())
  with check (
    public.is_school_admin()
    and status in ('Baru', 'Diproses', 'Selesai')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'incoming-mail-attachments',
  'incoming-mail-attachments',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "incoming mail attachments restricted to school admins" on storage.objects;
create policy "incoming mail attachments restricted to school admins"
  on storage.objects
  as restrictive
  for all
  to public
  using (bucket_id <> 'incoming-mail-attachments' or public.is_school_admin())
  with check (bucket_id <> 'incoming-mail-attachments' or public.is_school_admin());

drop policy if exists "school admins read incoming mail attachments" on storage.objects;
create policy "school admins read incoming mail attachments"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'incoming-mail-attachments' and public.is_school_admin());
