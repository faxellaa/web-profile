update public.facilities
set image_url = '/img/bahan/IMG_0674.jpeg'
where lower(btrim(name)) = 'ruang guru';

insert into public.facilities (name, description, image_url)
select
  'Ruang Guru',
  'Ruang kerja tenaga pendidik dan kependidikan untuk menyiapkan kegiatan sekolah.',
  '/img/bahan/IMG_0674.jpeg'
where not exists (
  select 1
  from public.facilities
  where lower(btrim(name)) = 'ruang guru'
);
