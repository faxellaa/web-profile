insert into public.facilities (name, description, image_url)
select
  'Lapangan',
  'Area lapangan sekolah untuk mendukung kegiatan olahraga dan aktivitas siswa.',
  '/img/bahan/IMG_0664.jpeg'
where not exists (
  select 1
  from public.facilities
  where lower(btrim(name)) = lower('Lapangan')
);
