insert into public.facilities (name, description, image_url)
select requested.name, requested.description, requested.image_url
from (
  values
    ('Ruang Kelas', 'Ruang belajar untuk kegiatan pembelajaran sehari-hari.', '/img/bahan/IMG_0658.jpeg'),
    ('Ruang Literasi', 'Area membaca dengan koleksi buku yang dapat dimanfaatkan siswa untuk belajar.', '/img/bahan/IMG_0635.jpeg'),
    ('Ruang Guru', 'Ruang kerja tenaga pendidik dan kependidikan untuk menyiapkan kegiatan sekolah.', '/img/bahan/IMG_0671.jpeg'),
    ('Ruang Kepala Sekolah', 'Ruang kerja kepala sekolah untuk mendukung koordinasi kegiatan sekolah.', '/img/bahan/IMG_0643.jpeg'),
    ('Ruang Multimedia', 'Ruang pembelajaran yang dilengkapi layar interaktif.', '/img/bahan/IMG_0645.jpeg'),
    ('Lapangan', 'Area lapangan sekolah untuk mendukung kegiatan olahraga dan aktivitas siswa.', '/img/bahan/IMG_0664.jpeg')
) as requested(name, description, image_url)
where not exists (
  select 1
  from public.facilities existing
  where lower(btrim(existing.name)) = lower(requested.name)
);
