alter table public.extracurriculars
  add column if not exists image_path text;

alter table public.articles
  add column if not exists image_path text;
