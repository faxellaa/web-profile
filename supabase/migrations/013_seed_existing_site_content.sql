insert into public.teachers (name, title, role, photo_url, sort_order)
select requested.name, requested.title, requested.role, requested.photo_url, requested.sort_order
from (
  values
    ('Isti Awalia', 'S.Pd., M.Pd., Gr.', 'Kepala Sekolah', '/img/guru/Isti%20KS.jpg', 0),
    ('Lina Fatimatuz Zahroh', 'S.Pd., Gr.', 'Guru', null, 1),
    ('Puspita Kursiani', 'S.Pd., Gr.', 'Guru', '/img/guru/Puspita%20PKn.jpg', 2),
    ('Ikhwan Nur Rozak', 'S.Kom.', 'Guru', '/img/guru/Ikhwan%20Informatika.jpg', 3),
    ('Risa Maghfiroh Aulia Ramadhani', 'S.Pd.', 'Guru', '/img/guru/Risa%20IPA.jpg', 4),
    ('Al Mukmin', 'S.Pd.', 'Guru', '/img/guru/Mukmin%20PAI%20Ismuba.jpg', 5),
    ('Cikita Cahya Aprilia', 'S.Pd.', 'Guru', '/img/guru/Cikita%20Bhs%20Indo.jpg', 6),
    ('Desti Kristiani', 'A.Md.', 'Tata Usaha', '/img/guru/Desti%20TU.jpg', 7),
    ('Nur Indah Parwitasari', 'S.S.', 'Guru', null, 8),
    ('Agung Wiratmoko', 'S.Sos., Gr.', 'Guru', '/img/guru/Agung%20IPS.jpg', 9)
) as requested(name, title, role, photo_url, sort_order)
where not exists (
  select 1
  from public.teachers existing
  where lower(btrim(existing.name)) = lower(requested.name)
);

insert into public.articles (title, category, description, image_url, image_path)
select requested.title, 'Prestasi Siswa', requested.description, requested.image_url, null
from (
  values
    ('Seleksi POPDA & O2SN', 'Gavin Sakha Arkan Wibawa (kelas 7) mengikuti seleksi cabang silat seni dan Wushu, dan melangkah ke tingkat Kabupaten mewakili sekolah dan Sub-Rayon 7.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.26%20%281%29.jpeg'),
    ('Seleksi POPDA cabang Wushu', 'Ahmad Mustofa (kelas 8) lolos seleksi tingkat Sub-Rayon 7 dan melangkah ke tingkat Kabupaten mewakili sekolah.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.26.jpeg'),
    ('Seleksi POPDA cabang Wushu', 'Adi Prayoga (kelas 9) lolos seleksi tingkat Sub-Rayon 7 dan melangkah ke tingkat Kabupaten mewakili sekolah.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.27.jpeg'),
    ('Piala Presiden 2026', 'Gavin Sakha Arkan Wibawa (kelas 7) meraih Juara 1 kategori tanding Pra Remaja Putra Kelas Prestasi Pool 3 pada Kejuaraan Pencak Silat CNN Indonesia tingkat nasional, 25–28 Juni 2026.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.28%20%282%29.jpeg'),
    ('Seleksi POPDA cabang Wushu', 'Khaira Putri Maulida (kelas 7) lolos seleksi tingkat Sub-Rayon 7 dan melangkah ke tingkat Kabupaten mewakili sekolah.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.28.jpeg'),
    ('KST-8 Jateng & DIY', 'Aldila Cahya Humaira (kelas 9) meraih Juara 3 Olimpiade Matematika tingkat Provinsi dalam Kompetisi Sains Terbuka 2024.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.05%20%281%29.jpeg'),
    ('Wushu Santa Putra 48 Kg', 'Gavin Sakha Arkan Wibawa (kelas 7) meraih Juara 1 pada POPDA Banyumas 2026.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.05%20%282%29.jpeg'),
    ('OSM Kab. Banyumas', 'Aldila Cahya Humaira (kelas 9) meraih Medali Emas Olimpiade Sekolah Muhammadiyah tingkat Kabupaten Banyumas tahun 2024.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.05.jpeg'),
    ('Wushu Santa Putri 45 Kg', 'Novi Novia Agsa (kelas 8) meraih Juara 1 pada POPDA Banyumas 2026.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%281%29.jpeg'),
    ('Wushu Santa Putra 48 Kg', 'Ahmad Mustofa (kelas 8) meraih Juara 3 pada POPDA Banyumas 2026.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%282%29.jpeg'),
    ('Wushu Santa Putri 45 Kg', 'Khaira Putri Maulida (kelas 7) meraih Juara 3 pada POPDA Banyumas 2026.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%283%29.jpeg'),
    ('Wushu Santa Putri 45 Kg', 'Maryam Nuraini meraih Juara 3 pada POPDA Banyumas 2026.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%284%29.jpeg'),
    ('Bupati Cup Pemalang 2025', 'Muhammad Yusuf (kelas 9) meraih Juara 1 Pencak Silat Kelas J Putra Pra Remaja.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%285%29.jpeg'),
    ('Pencak Silat 2024', 'Gavin Sakha Arkhan W (kelas 7) meraih Juara 1 pada empat kejuaraan, termasuk Piala KASAD Usia Dini, Kejurkab Pemalang, dan Kejurnas Open Tournament Jawara PML.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%286%29.jpeg'),
    ('Visiting Lecture', 'Kegiatan Jejak Ilmu dan Budaya bersama Prof. Masanori Fukui dari Tokushima University, Jepang, pada 17 Februari 2025.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%288%29.jpeg'),
    ('Learning Beyond Borders', 'Kegiatan belajar bersama mahasiswa Capiz State University (CAPSU), Filipina, pada 10 Februari 2025.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%289%29.jpeg'),
    ('Seleksi POPDA cabang Wushu', 'Suci Fitriana (kelas 8) lolos seleksi tingkat Sub-Rayon 7 dan melangkah ke tingkat Kabupaten mewakili sekolah.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.27%20%281%29.jpeg'),
    ('Seleksi POPDA cabang Wushu', 'Novi Novia Agsa (kelas 8) lolos seleksi tingkat Sub-Rayon 7 dan melangkah ke tingkat Kabupaten mewakili sekolah.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.27%20%282%29.jpeg'),
    ('Wushu Santa Putra 52 Kg', 'Adi Prayoga (kelas 9) meraih Juara 1 pada POPDA Banyumas 2026.', '/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06.jpeg')
) as requested(title, description, image_url)
where not exists (
  select 1
  from public.articles existing
  where existing.category = 'Prestasi Siswa'
    and existing.image_url = requested.image_url
);

with gallery_photos(file_name, sort_order) as (
  select file_name, ordinal::integer
  from unnest(array[
    'IMG_0629.jpeg', 'IMG_0630.jpeg', 'IMG_0631.jpeg', 'IMG_0632.jpeg',
    'IMG_0633.jpeg', 'IMG_0634.jpeg', 'IMG_0635.jpeg', 'IMG_0636.jpeg',
    'IMG_0637.jpeg', 'IMG_0638.jpeg', 'IMG_0639.jpeg', 'IMG_0640.jpeg',
    'IMG_0641.jpeg', 'IMG_0642.jpeg', 'IMG_0643.jpeg', 'IMG_0644.jpeg',
    'IMG_0645.jpeg', 'IMG_0646.jpeg', 'IMG_0647.jpeg', 'IMG_0648.jpeg',
    'IMG_0649.jpeg', 'IMG_0650.jpeg', 'IMG_0651.jpeg', 'IMG_0652.jpeg',
    'IMG_0653.jpeg', 'IMG_0654.jpeg', 'IMG_0655.jpeg', 'IMG_0656.jpeg',
    'IMG_0657.jpeg', 'IMG_0658.jpeg', 'IMG_0659.jpeg', 'IMG_0660.jpeg',
    'IMG_0661.jpeg', 'IMG_0662.jpeg', 'IMG_0663.jpeg', 'IMG_0664.jpeg',
    'IMG_0665.jpeg', 'IMG_0666.jpeg', 'IMG_0668.jpeg',
    'IMG_0669.jpeg', 'IMG_0670.jpeg', 'IMG_0671.jpeg', 'IMG_0672.jpeg',
    'IMG_0673.jpeg', 'IMG_0674.jpeg', 'IMG_0675.jpeg', 'IMG_0676.jpeg',
    'IMG_0677.jpeg', 'IMG_0678.jpeg', 'IMG_0679.jpeg', 'IMG_0680.jpeg',
    'IMG_0681.jpeg', 'IMG_0682.jpeg', 'IMG_0683.jpeg', 'IMG_0684.jpeg',
    'IMG_0685.jpeg', 'IMG_0686.jpeg', 'IMG_0688.jpeg',
    'IMG_0690.jpeg', 'IMG_0691.jpeg', 'IMG_0692.jpeg', 'IMG_0693.jpeg'
  ]) with ordinality as files(file_name, ordinal)
)
insert into public.school_gallery_items (media_type, title, media_url, storage_path, sort_order)
select
  'photo',
  'Dokumentasi sekolah - ' || file_name,
  '/img/bahan/' || file_name,
  null,
  sort_order
from gallery_photos requested
where not exists (
  select 1
  from public.school_gallery_items existing
  where existing.media_type = 'photo'
    and existing.media_url = '/img/bahan/' || requested.file_name
);

with featured_videos(video_id, title, sort_order) as (
  values
    ('IGIRUAZDsfU', 'Sudah pernah dengar kisah teladan Nabi yang berjudul "8 Dirham"?', 0),
    ('-2Cz46PrI_A', 'Episode 1 KURMA - 4 Golongan orang yang dirindukan surga', 1),
    ('3qodDL0ZOLk', 'Pembelajaran Ber-KSE Mapel IPA kelas IX', 2),
    ('3jS7Ga8sFaw', 'Upacara Bendera memperingati HUT Kemerdekaan ke 79 Republik Indonesia pada 17 Agustus 2024 di Kramat', 3),
    ('xeZaLKuB4KM', 'MPLS Hari Pertama SMP Muhammadiyah Kembaran, 22 Juli 2024', 4),
    ('FlM_T4AXImI', 'Perpisahan SMP Muhammadiyah Kembaran tahun ajaran 2023-2024', 5),
    ('WYBQg19s8Cg', 'Program P5 SMP Muhammadiyah Kembaran Tahun 2023-2024', 6),
    ('N4pLawDWr3c', 'Pesantren Kilat Ramadhan - Benar atau salah materi Sholat Idul Fitri', 7),
    ('qMp9bcRC3Gc', 'Apel Pagi di SMP Muhammadiyah Kembaran oleh Kapolsek Kembaran', 8)
)
insert into public.school_gallery_items (media_type, title, media_url, storage_path, sort_order)
select
  'video',
  requested.title,
  'https://youtu.be/' || requested.video_id,
  null,
  requested.sort_order
from featured_videos requested
where not exists (
  select 1
  from public.school_gallery_items existing
  where existing.media_type = 'video'
    and position(requested.video_id in existing.media_url) > 0
);
