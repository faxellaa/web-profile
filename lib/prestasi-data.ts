export type Bilingual = { id: string; en: string };

export type PrestasiInfo = {
  name: Bilingual;
  grade?: string;
  badge: Bilingual;
  title: Bilingual;
  event: Bilingual;
  detail?: Bilingual;
};

const SELEKSI: Bilingual = { id: 'Lolos Seleksi', en: 'Passed Selection' };
const POPDA_NEXT: Bilingual = {
  id: 'Melangkah ke jenjang Kabupaten mewakili sekolah dan Sub-Rayon 7.',
  en: 'Advancing to the district level representing the school and Sub-Rayon 7.',
};
const POPDA_WUSHU: Bilingual = { id: 'Seleksi POPDA cabang Wushu', en: 'POPDA Wushu selection' };
const WUSHU_BANYUMAS: Bilingual = { id: 'POPDA Banyumas 2026', en: 'POPDA Banyumas 2026' };

const juara = (n: number): Bilingual => ({ id: `Juara ${n}`, en: `${n === 1 ? '1st' : n === 2 ? '2nd' : '3rd'} Place` });
const person = (name: string): Bilingual => ({ id: name, en: name });

// Kunci = nama file di public/img/prestasi. Tambahkan entri baru di sini saat menambah foto.
export const PRESTASI_INFO: Record<string, PrestasiInfo> = {
  'WhatsApp Image 2026-10-11 at 16.15.26 (1).jpeg': {
    name: person('Gavin Sakha Arkan Wibawa'),
    grade: '7',
    badge: SELEKSI,
    title: { id: 'Seleksi POPDA & O2SN', en: 'POPDA & O2SN Selection' },
    event: { id: 'Cabang Silat Seni dan Wushu', en: 'Artistic Pencak Silat and Wushu' },
    detail: POPDA_NEXT,
  },
  'WhatsApp Image 2026-10-11 at 16.15.26.jpeg': {
    name: person('Ahmad Mustofa'),
    grade: '8',
    badge: SELEKSI,
    title: POPDA_WUSHU,
    event: { id: 'Tingkat Sub-Rayon 7', en: 'Sub-Rayon 7 level' },
    detail: POPDA_NEXT,
  },
  'WhatsApp Image 2026-10-11 at 16.15.27 (1).jpeg': {
    name: person('Suci Fitriana'),
    grade: '8',
    badge: SELEKSI,
    title: POPDA_WUSHU,
    event: { id: 'Tingkat Sub-Rayon 7', en: 'Sub-Rayon 7 level' },
    detail: POPDA_NEXT,
  },
  'WhatsApp Image 2026-10-11 at 16.15.27 (2).jpeg': {
    name: person('Novi Novia Agsa'),
    grade: '8',
    badge: SELEKSI,
    title: POPDA_WUSHU,
    event: { id: 'Tingkat Sub-Rayon 7', en: 'Sub-Rayon 7 level' },
    detail: POPDA_NEXT,
  },
  'WhatsApp Image 2026-10-11 at 16.15.27.jpeg': {
    name: person('Adi Prayoga'),
    grade: '9',
    badge: SELEKSI,
    title: POPDA_WUSHU,
    event: { id: 'Tingkat Sub-Rayon 7', en: 'Sub-Rayon 7 level' },
    detail: POPDA_NEXT,
  },
  'WhatsApp Image 2026-10-11 at 16.15.28 (2).jpeg': {
    name: person('Gavin Sakha Arkan Wibawa'),
    grade: '7',
    badge: juara(1),
    title: { id: 'Piala Presiden 2026', en: 'Presidential Cup 2026' },
    event: { id: 'Kejuaraan Pencak Silat CNN Indonesia Tingkat Nasional', en: 'CNN Indonesia National Pencak Silat Championship' },
    detail: {
      id: 'Kategori Tanding Pra Remaja Putra Kelas Prestasi Pool 3, 25-28 Juni 2026.',
      en: 'Boys Pre-Teen Fighting, Achievement Class Pool 3, 25-28 June 2026.',
    },
  },
  'WhatsApp Image 2026-10-11 at 16.15.28.jpeg': {
    name: person('Khaira Putri Maulida'),
    grade: '7',
    badge: SELEKSI,
    title: POPDA_WUSHU,
    event: { id: 'Tingkat Sub-Rayon 7', en: 'Sub-Rayon 7 level' },
    detail: POPDA_NEXT,
  },
  'WhatsApp Image 2026-10-11 at 16.16.05 (1).jpeg': {
    name: person('Aldila Cahya Humaira'),
    grade: '9',
    badge: juara(3),
    title: { id: 'KST-8 Jateng & DIY', en: 'KST-8 Central Java & DIY' },
    event: { id: 'Olimpiade cabang Matematika tingkat Provinsi', en: 'Mathematics Olympiad, provincial level' },
    detail: { id: 'Kompetisi Sains Terbuka 2024.', en: 'Open Science Competition 2024.' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.05 (2).jpeg': {
    name: person('Gavin Sakha Arkan Wibawa'),
    grade: '7',
    badge: juara(1),
    title: WUSHU_BANYUMAS,
    event: { id: 'Wushu Santa Putra 48 Kg', en: 'Wushu Sanda Boys 48 Kg' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.05.jpeg': {
    name: person('Aldila Cahya Humaira'),
    grade: '9',
    badge: { id: 'Medali Emas', en: 'Gold Medal' },
    title: { id: 'OSM Kab. Banyumas', en: 'OSM Banyumas Regency' },
    event: { id: 'Olimpiade Sekolah Muhammadiyah tingkat Kabupaten Banyumas', en: 'Muhammadiyah School Olympiad, Banyumas Regency level' },
    detail: { id: 'Tahun 2024.', en: 'Year 2024.' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (1).jpeg': {
    name: person('Novi Novia Agsa'),
    grade: '8',
    badge: juara(1),
    title: WUSHU_BANYUMAS,
    event: { id: 'Wushu Santa Putri 45 Kg', en: 'Wushu Sanda Girls 45 Kg' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (2).jpeg': {
    name: person('Ahmad Mustofa'),
    grade: '8',
    badge: juara(3),
    title: WUSHU_BANYUMAS,
    event: { id: 'Wushu Santa Putra 48 Kg', en: 'Wushu Sanda Boys 48 Kg' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (3).jpeg': {
    name: person('Khaira Putri Maulida'),
    grade: '7',
    badge: juara(3),
    title: WUSHU_BANYUMAS,
    event: { id: 'Wushu Santa Putri 45 Kg', en: 'Wushu Sanda Girls 45 Kg' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (4).jpeg': {
    name: person('Maryam Nuraini'),
    badge: juara(3),
    title: WUSHU_BANYUMAS,
    event: { id: 'Wushu Santa Putri 45 Kg', en: 'Wushu Sanda Girls 45 Kg' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (5).jpeg': {
    name: person('Muhammad Yusuf'),
    grade: '9',
    badge: juara(1),
    title: { id: 'Bupati Cup Pemalang 2025', en: 'Pemalang Regent Cup 2025' },
    event: { id: 'Pencak Silat Kelas J Putra Pra Remaja', en: 'Pencak Silat Class J, Boys Pre-Teen' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (6).jpeg': {
    name: { id: 'Gavin Sakha Arkhan W', en: 'Gavin Sakha Arkhan W' },
    grade: '7',
    badge: { id: 'Juara 1 (4 Kejuaraan)', en: '1st Place (4 Championships)' },
    title: { id: 'Pencak Silat 2024', en: 'Pencak Silat 2024' },
    event: {
      id: 'Piala KASAD Usia Dini, Kejurkab Pemalang, dan Kejurnas Open Turnament Jawara PML.',
      en: 'KASAD Cup Early Age, Pemalang Regency Championship, and Jawara PML National Open Tournament.',
    },
    detail: { id: 'Juga meraih Pesilat Terbaik Kejurnas Pencak Silat Pemalang.', en: 'Also named Best Fighter at the Pemalang National Pencak Silat Championship.' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (8).jpeg': {
    name: { id: 'Prof. Masanori Fukui', en: 'Prof. Masanori Fukui' },
    badge: { id: 'Kegiatan', en: 'Activity' },
    title: { id: 'Visiting Lecture', en: 'Visiting Lecture' },
    event: { id: 'Tokushima University, Jepang', en: 'Tokushima University, Japan' },
    detail: { id: 'Jejak Ilmu dan Budaya: Inspirasi Belajar Bersama Profesor Jepang, 17 Februari 2025.', en: 'Footprints of Knowledge and Culture: Learning Inspiration with a Japanese Professor, 17 February 2025.' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06 (9).jpeg': {
    name: { id: 'Mahasiswa Capiz State University', en: 'Capiz State University students' },
    badge: { id: 'Kegiatan', en: 'Activity' },
    title: { id: 'Learning Beyond Borders', en: 'Learning Beyond Borders' },
    event: { id: 'Capiz State University (CAPSU), Filipina', en: 'Capiz State University (CAPSU), Philippines' },
    detail: { id: 'Serunya KBM bersama mahasiswa Filipina, 10 Februari 2025.', en: 'Joint classroom activities with Filipino students, 10 February 2025.' },
  },
  'WhatsApp Image 2026-10-11 at 16.16.06.jpeg': {
    name: person('Adi Prayoga'),
    grade: '9',
    badge: juara(1),
    title: WUSHU_BANYUMAS,
    event: { id: 'Wushu Santa Putra 52 Kg', en: 'Wushu Sanda Boys 52 Kg' },
  },
};
