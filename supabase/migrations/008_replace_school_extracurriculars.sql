begin;

update public.extracurriculars
set
  name = case lower(btrim(name))
    when 'ikatan pelajar muh. (ipm)' then 'Ikatan Pelajar Muhammadiyah (IPM)'
    when 'tapak suci putra muh.' then 'Tapak Suci'
    when 'hizbul wathan (hw)' then 'Hizbul Wathan'
  end,
  badge = case lower(btrim(name))
    when 'ikatan pelajar muh. (ipm)' then 'IPM'
    when 'tapak suci putra muh.' then 'TS'
    when 'hizbul wathan (hw)' then 'HW'
  end,
  tag = case lower(btrim(name))
    when 'ikatan pelajar muh. (ipm)' then 'ORGANISASI'
    when 'tapak suci putra muh.' then 'BELA DIRI'
    when 'hizbul wathan (hw)' then 'KEPANDUAN'
  end,
  description = case lower(btrim(name))
    when 'ikatan pelajar muh. (ipm)' then 'Organisasi pelajar Muhammadiyah untuk mengembangkan kepemimpinan, tanggung jawab, dan dakwah siswa.'
    when 'tapak suci putra muh.' then 'Kegiatan bela diri pencak silat untuk membina disiplin, kebugaran, dan karakter siswa.'
    when 'hizbul wathan (hw)' then 'Kegiatan kepanduan untuk melatih kemandirian, kepemimpinan, dan ketangkasan siswa.'
  end,
  image_url = null
where lower(btrim(name)) in (
  'ikatan pelajar muh. (ipm)',
  'tapak suci putra muh.',
  'hizbul wathan (hw)'
);

update public.extracurriculars
set
  badge = case lower(btrim(name))
    when 'english club' then 'EC'
    when 'ikatan pelajar muhammadiyah (ipm)' then 'IPM'
    when 'tapak suci' then 'TS'
    when 'hizbul wathan' then 'HW'
    when 'tahsin' then 'T'
  end,
  tag = case lower(btrim(name))
    when 'english club' then 'BAHASA'
    when 'ikatan pelajar muhammadiyah (ipm)' then 'ORGANISASI'
    when 'tapak suci' then 'BELA DIRI'
    when 'hizbul wathan' then 'KEPANDUAN'
    when 'tahsin' then 'KEAGAMAAN'
  end,
  description = case lower(btrim(name))
    when 'english club' then 'Kegiatan untuk melatih kemampuan berbahasa Inggris, komunikasi, dan kepercayaan diri siswa.'
    when 'ikatan pelajar muhammadiyah (ipm)' then 'Organisasi pelajar Muhammadiyah untuk mengembangkan kepemimpinan, tanggung jawab, dan dakwah siswa.'
    when 'tapak suci' then 'Kegiatan bela diri pencak silat untuk membina disiplin, kebugaran, dan karakter siswa.'
    when 'hizbul wathan' then 'Kegiatan kepanduan untuk melatih kemandirian, kepemimpinan, dan ketangkasan siswa.'
    when 'tahsin' then 'Kegiatan untuk memperbaiki bacaan Al-Qur’an sesuai kaidah tajwid.'
  end
where lower(btrim(name)) in (
  'english club',
  'ikatan pelajar muhammadiyah (ipm)',
  'tapak suci',
  'hizbul wathan',
  'tahsin'
);

delete from public.extracurriculars
where lower(btrim(name)) not in (
  'english club',
  'ikatan pelajar muhammadiyah (ipm)',
  'tapak suci',
  'hizbul wathan',
  'tahsin'
);

insert into public.extracurriculars (name, badge, tag, description, image_url)
select requested.name, requested.badge, requested.tag, requested.description, null
from (
  values
    ('English Club', 'EC', 'BAHASA', 'Kegiatan untuk melatih kemampuan berbahasa Inggris, komunikasi, dan kepercayaan diri siswa.'),
    ('Ikatan Pelajar Muhammadiyah (IPM)', 'IPM', 'ORGANISASI', 'Organisasi pelajar Muhammadiyah untuk mengembangkan kepemimpinan, tanggung jawab, dan dakwah siswa.'),
    ('Tapak Suci', 'TS', 'BELA DIRI', 'Kegiatan bela diri pencak silat untuk membina disiplin, kebugaran, dan karakter siswa.'),
    ('Hizbul Wathan', 'HW', 'KEPANDUAN', 'Kegiatan kepanduan untuk melatih kemandirian, kepemimpinan, dan ketangkasan siswa.'),
    ('Tahsin', 'T', 'KEAGAMAAN', 'Kegiatan untuk memperbaiki bacaan Al-Qur’an sesuai kaidah tajwid.')
) as requested(name, badge, tag, description)
where not exists (
  select 1
  from public.extracurriculars existing
  where lower(btrim(existing.name)) = lower(requested.name)
);

commit;
