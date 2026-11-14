alter table public.facilities
  add column if not exists name_en text,
  add column if not exists description_en text;

alter table public.extracurriculars
  add column if not exists name_en text,
  add column if not exists tag_en text,
  add column if not exists description_en text;

alter table public.articles
  add column if not exists title_en text,
  add column if not exists category_en text,
  add column if not exists description_en text,
  add column if not exists date_label_en text;

alter table public.school_gallery_items
  add column if not exists title_en text;

alter table public.school_stats
  add column if not exists headmaster_speech_en text;

update public.facilities as facility
set
  name_en = coalesce(nullif(btrim(facility.name_en), ''), translation.name_en),
  description_en = coalesce(nullif(btrim(facility.description_en), ''), translation.description_en)
from (
  values
    ('Ruang Kelas', 'Classroom', 'A learning space for everyday lessons.'),
    ('Ruang Literasi', 'Literacy Room', 'A reading area with a collection of books students can use for learning.'),
    ('Ruang Guru', 'Teachers’ Room', 'A workspace for teachers and education staff to prepare school activities.'),
    ('Ruang Kepala Sekolah', 'Principal’s Office', 'The principal’s workspace for coordinating school activities.'),
    ('Ruang Tata Usaha', 'Administrative Office', 'An office for school administration and student services.'),
    ('Ruang Multimedia', 'Multimedia Room', 'A learning space equipped with an interactive display.'),
    ('Lapangan', 'School Field', 'An outdoor area for sports and student activities.'),
    ('Lapangan Sekolah', 'School Field', 'An outdoor area for sports and student activities.')
) as translation(name, name_en, description_en)
where lower(btrim(facility.name)) = lower(translation.name)
  and (
    facility.name_en is null
    or btrim(facility.name_en) = ''
    or facility.description_en is null
    or btrim(facility.description_en) = ''
  );

update public.extracurriculars as activity
set
  name_en = coalesce(nullif(btrim(activity.name_en), ''), translation.name_en),
  tag_en = coalesce(nullif(btrim(activity.tag_en), ''), translation.tag_en),
  description_en = coalesce(nullif(btrim(activity.description_en), ''), translation.description_en)
from (
  values
    ('English Club', 'English Club', 'Language', 'Activities that build students’ English skills, communication, and confidence.'),
    ('Ikatan Pelajar Muhammadiyah (IPM)', 'Muhammadiyah Student Association (IPM)', 'Organization', 'A Muhammadiyah student organization that develops leadership, responsibility, and students’ commitment to service.'),
    ('Tapak Suci', 'Tapak Suci', 'Martial Arts', 'Pencak silat training that builds discipline, fitness, and character.'),
    ('Hizbul Wathan', 'Hizbul Wathan', 'Scouting', 'Scouting activities that develop independence, leadership, and agility.'),
    ('Tahsin', 'Tahsin', 'Religious Studies', 'Activities to improve Qur’an recitation in accordance with tajwid rules.')
) as translation(name, name_en, tag_en, description_en)
where lower(btrim(activity.name)) = lower(translation.name)
  and (
    activity.name_en is null
    or btrim(activity.name_en) = ''
    or activity.tag_en is null
    or btrim(activity.tag_en) = ''
    or activity.description_en is null
    or btrim(activity.description_en) = ''
  );

update public.articles as article
set
  title_en = coalesce(nullif(btrim(article.title_en), ''), translation.title_en),
  category_en = coalesce(nullif(btrim(article.category_en), ''), 'Student Achievement'),
  description_en = coalesce(nullif(btrim(article.description_en), ''), translation.description_en)
from (
  values
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.26%20%281%29.jpeg', 'POPDA & O2SN Selection', 'Gavin Sakha Arkan Wibawa (Grade 7) took part in the artistic pencak silat and wushu selection, advancing to the regency level to represent the school and Sub-Rayon 7.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.26.jpeg', 'POPDA Wushu Selection', 'Ahmad Mustofa (Grade 8) passed the Sub-Rayon 7 selection and advanced to the regency level to represent the school.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.27.jpeg', 'POPDA Wushu Selection', 'Adi Prayoga (Grade 9) passed the Sub-Rayon 7 selection and advanced to the regency level to represent the school.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.28%20%282%29.jpeg', 'Presidential Cup 2026', 'Gavin Sakha Arkan Wibawa (Grade 7) won first place in the Boys’ Pre-Teen Fighting, Achievement Class Pool 3, at the CNN Indonesia National Pencak Silat Championship, June 25–28, 2026.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.28.jpeg', 'POPDA Wushu Selection', 'Khaira Putri Maulida (Grade 7) passed the Sub-Rayon 7 selection and advanced to the regency level to represent the school.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.05%20%281%29.jpeg', 'KST-8 Central Java & Yogyakarta', 'Aldila Cahya Humaira (Grade 9) won third place in the provincial Mathematics Olympiad at the 2024 Open Science Competition.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.05%20%282%29.jpeg', 'Wushu Sanda Boys 48 kg', 'Gavin Sakha Arkan Wibawa (Grade 7) won first place at POPDA Banyumas 2026.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.05.jpeg', 'Banyumas Muhammadiyah School Olympiad', 'Aldila Cahya Humaira (Grade 9) won a gold medal at the Banyumas Regency Muhammadiyah School Olympiad in 2024.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%281%29.jpeg', 'Wushu Sanda Girls 45 kg', 'Novi Novia Agsa (Grade 8) won first place at POPDA Banyumas 2026.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%282%29.jpeg', 'Wushu Sanda Boys 48 kg', 'Ahmad Mustofa (Grade 8) won third place at POPDA Banyumas 2026.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%283%29.jpeg', 'Wushu Sanda Girls 45 kg', 'Khaira Putri Maulida (Grade 7) won third place at POPDA Banyumas 2026.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%284%29.jpeg', 'Wushu Sanda Girls 45 kg', 'Maryam Nuraini won third place at POPDA Banyumas 2026.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%285%29.jpeg', 'Pemalang Regent’s Cup 2025', 'Muhammad Yusuf (Grade 9) won first place in the Boys’ Pre-Teen Pencak Silat Class J.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%286%29.jpeg', 'Pencak Silat 2024', 'Gavin Sakha Arkhan W (Grade 7) won first place in four championships, including the KASAD Cup Early Age, Pemalang Regency Championship, and Jawara PML National Open Tournament.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%288%29.jpeg', 'Visiting Lecture', 'A learning and cultural exchange with Prof. Masanori Fukui of Tokushima University, Japan, on February 17, 2025.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06%20%289%29.jpeg', 'Learning Beyond Borders', 'A joint learning activity with students from Capiz State University (CAPSU), Philippines, on February 10, 2025.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.27%20%281%29.jpeg', 'POPDA Wushu Selection', 'Suci Fitriana (Grade 8) passed the Sub-Rayon 7 selection and advanced to the regency level to represent the school.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.15.27%20%282%29.jpeg', 'POPDA Wushu Selection', 'Novi Novia Agsa (Grade 8) passed the Sub-Rayon 7 selection and advanced to the regency level to represent the school.'),
    ('/img/prestasi/WhatsApp%20Image%202026-10-11%20at%2016.16.06.jpeg', 'Wushu Sanda Boys 52 kg', 'Adi Prayoga (Grade 9) won first place at POPDA Banyumas 2026.')
) as translation(image_url, title_en, description_en)
where article.category = 'Prestasi Siswa'
  and article.image_url = translation.image_url
  and (
    article.title_en is null
    or btrim(article.title_en) = ''
    or article.category_en is null
    or btrim(article.category_en) = ''
    or article.description_en is null
    or btrim(article.description_en) = ''
  );

update public.school_gallery_items as item
set title_en = translation.title_en
from (
  values
    ('IGIRUAZDsfU', 'Have you heard the inspiring story of the Prophet called “8 Dirham”?'),
    ('-2Cz46PrI_A', 'KURMA Episode 1: Four groups of people longed for by Paradise'),
    ('3qodDL0ZOLk', 'Social and Emotional Learning (KSE) in Grade 9 Science'),
    ('3jS7Ga8sFaw', 'Flag ceremony for Indonesia’s 79th Independence Day, August 17, 2024, in Kramat'),
    ('xeZaLKuB4KM', 'First day of student orientation at SMP Muhammadiyah Kembaran, July 22, 2024'),
    ('FlM_T4AXImI', 'SMP Muhammadiyah Kembaran farewell ceremony, 2023–2024 academic year'),
    ('WYBQg19s8Cg', 'P5 Program at SMP Muhammadiyah Kembaran, 2023–2024'),
    ('N4pLawDWr3c', 'Ramadan short course: Eid al-Fitr prayer lesson'),
    ('qMp9bcRC3Gc', 'Morning assembly at SMP Muhammadiyah Kembaran with the Kembaran Police Chief')
) as translation(video_id, title_en)
where item.media_type = 'video'
  and item.media_url like '%' || translation.video_id || '%'
  and (item.title_en is null or btrim(item.title_en) = '');
