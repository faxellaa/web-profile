with default_videos(video_id, title, sort_order) as (
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
from default_videos requested
where not exists (
  select 1
  from public.school_gallery_items existing
  where existing.media_type = 'video'
    and position(requested.video_id in existing.media_url) > 0
);
