export type SchoolTeacher = {
  id?: string;
  name: string;
  title?: string;
  role: string;
  photo_url?: string;
  sort_order?: number;
};

const TEACHER_ROLE_WORDS: [RegExp, string][] = [
  [/Wakil Kepala Sekolah/gi, 'Vice Principal'],
  [/Kepala Sekolah/gi, 'Headmaster'],
  [/Wakil Kepala/gi, 'Vice Principal'],
  [/Tata Usaha/gi, 'Administration Staff'],
  [/Tenaga Kependidikan/gi, 'Education Staff'],
  [/Guru/gi, 'Teacher'],
  [/Staf(f)?/gi, 'Staff'],
  [/Bahasa Indonesia/gi, 'Indonesian'],
  [/Bahasa Inggris/gi, 'English'],
  [/Bahasa Jawa/gi, 'Javanese'],
  [/Bahasa Arab/gi, 'Arabic'],
  [/Matematika/gi, 'Mathematics'],
  [/IPA/g, 'Science'],
  [/IPS/g, 'Social Studies'],
  [/PKn/g, 'Civics'],
  [/Informatika/gi, 'Informatics'],
  [/Seni Budaya/gi, 'Arts & Culture'],
  [/Penjas|PJOK/gi, 'Physical Education'],
  [/Ismuba/gi, 'Ismuba'],
];

export const translateTeacherRole = (role: string) =>
  TEACHER_ROLE_WORDS.reduce((text, [pattern, english]) => text.replace(pattern, english), role);

export const HEADMASTER_NAME = 'Isti Awalia, S.Pd., M.Pd., Gr.';

export type SchoolFacility = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  name_en: string;
  description_en: string;
};

export const DEFAULT_FACILITIES: SchoolFacility[] = [
  {
    id: 'classroom',
    name: 'Ruang Kelas',
    description: 'Ruang belajar untuk kegiatan pembelajaran sehari-hari.',
    name_en: 'Classroom',
    description_en: 'A learning space for everyday lessons.',
    image_url: '/img/bahan/IMG_0658.jpeg',
  },
  {
    id: 'literacy-room',
    name: 'Ruang Literasi',
    description: 'Area membaca dengan koleksi buku yang dapat dimanfaatkan siswa untuk belajar.',
    name_en: 'Literacy Room',
    description_en: 'A reading area with books that students can use for learning.',
    image_url: '/img/bahan/IMG_0635.jpeg',
  },
  {
    id: 'teachers-room',
    name: 'Ruang Guru',
    description: 'Ruang kerja tenaga pendidik dan kependidikan untuk menyiapkan kegiatan sekolah.',
    name_en: 'Teachers’ Room',
    description_en: 'A workspace for teachers and education staff to prepare school activities.',
    image_url: '/img/bahan/IMG_0674.jpeg',
  },
  {
    id: 'principal-office',
    name: 'Ruang Kepala Sekolah',
    description: 'Ruang kerja kepala sekolah untuk mendukung koordinasi kegiatan sekolah.',
    name_en: 'Principal’s Office',
    description_en: 'The principal’s workspace for coordinating school activities.',
    image_url: '/img/bahan/IMG_0643.jpeg',
  },
  {
    id: 'administration-office',
    name: 'Ruang Tata Usaha',
    description: 'Ruang pelayanan administrasi dan pengelolaan tata usaha sekolah.',
    name_en: 'Administrative Office',
    description_en: 'An office for school administration and student services.',
    image_url: '/img/bahan/IMG_0690.jpeg',
  },
  {
    id: 'multimedia-room',
    name: 'Ruang Multimedia',
    description: 'Ruang pembelajaran yang dilengkapi layar interaktif.',
    name_en: 'Multimedia Room',
    description_en: 'A learning space equipped with an interactive display.',
    image_url: '/img/bahan/IMG_0645.jpeg',
  },
  {
    id: 'school-field',
    name: 'Lapangan',
    description: 'Area lapangan sekolah untuk mendukung kegiatan olahraga dan aktivitas siswa.',
    name_en: 'School Field',
    description_en: 'An outdoor area for sports and student activities.',
    image_url: '/img/bahan/IMG_0664.jpeg',
  },
];

export const findDefaultFacilityTranslation = (name: string) => {
  const normalizedName = name.trim().toLowerCase();
  return DEFAULT_FACILITIES.find((facility) => facility.name.toLowerCase() === normalizedName)
    ?? (normalizedName.includes('lapangan')
      ? DEFAULT_FACILITIES.find((facility) => facility.id === 'school-field')
      : undefined);
};

export function mergeDefaultFacilities<T extends { name: string }>(facilities: T[]): Array<T | SchoolFacility> {
  return facilities.length > 0 ? facilities : DEFAULT_FACILITIES;
}

export type SchoolExtracurricular = {
  id: string;
  name: string;
  name_en: string;
  badge: string;
  tag: string;
  tag_en: string;
  description: string;
  description_en: string;
  image_url: string | null;
};

export const DEFAULT_EXTRACURRICULARS: SchoolExtracurricular[] = [
  {
    id: 'english-club',
    name: 'English Club',
    name_en: 'English Club',
    badge: 'EC',
    tag: 'BAHASA',
    tag_en: 'LANGUAGE',
    description: 'Kegiatan untuk melatih kemampuan berbahasa Inggris, komunikasi, dan kepercayaan diri siswa.',
    description_en: 'Activities that build students’ English skills, communication, and confidence.',
    image_url: null,
  },
  {
    id: 'ipm',
    name: 'Ikatan Pelajar Muhammadiyah (IPM)',
    name_en: 'Muhammadiyah Student Association (IPM)',
    badge: 'IPM',
    tag: 'ORGANISASI',
    tag_en: 'ORGANIZATION',
    description: 'Organisasi pelajar Muhammadiyah untuk mengembangkan kepemimpinan, tanggung jawab, dan dakwah siswa.',
    description_en: 'A Muhammadiyah student organization that develops leadership, responsibility, and students’ commitment to service.',
    image_url: null,
  },
  {
    id: 'tapak-suci',
    name: 'Tapak Suci',
    name_en: 'Tapak Suci',
    badge: 'TS',
    tag: 'BELA DIRI',
    tag_en: 'MARTIAL ARTS',
    description: 'Kegiatan bela diri pencak silat untuk membina disiplin, kebugaran, dan karakter siswa.',
    description_en: 'Pencak silat training that builds discipline, fitness, and character.',
    image_url: null,
  },
  {
    id: 'hizbul-wathan',
    name: 'Hizbul Wathan',
    name_en: 'Hizbul Wathan',
    badge: 'HW',
    tag: 'KEPANDUAN',
    tag_en: 'SCOUTING',
    description: 'Kegiatan kepanduan untuk melatih kemandirian, kepemimpinan, dan ketangkasan siswa.',
    description_en: 'Scouting activities that develop independence, leadership, and agility.',
    image_url: null,
  },
  {
    id: 'tahsin',
    name: 'Tahsin',
    name_en: 'Tahsin',
    badge: 'T',
    tag: 'KEAGAMAAN',
    tag_en: 'RELIGIOUS STUDIES',
    description: 'Kegiatan untuk memperbaiki bacaan Al-Qur’an sesuai kaidah tajwid.',
    description_en: 'Activities to improve Qur’an recitation in accordance with tajwid rules.',
    image_url: null,
  },
];

export function orderExtracurriculars<T extends { name: string }>(activities: T[]): T[] {
  const order = new Map(DEFAULT_EXTRACURRICULARS.map((activity, index) => [activity.name.toLowerCase(), index]));
  return [...activities].sort((a, b) =>
    (order.get(a.name.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER)
    - (order.get(b.name.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER),
  );
}

export const SCHOOL_VISION_CONTEXT = 'Kurikulum Operasional Sekolah disusun oleh Satuan Pendidikan untuk memungkinkan penyesuaian program pendidikan dengan kebutuhan dan potensi yang ada di sekolah. Sekolah sebagai unit penyelenggara pendidikan juga harus memperhatikan perkembangan dan tantangan masa depan, di antaranya perkembangan ilmu pengetahuan dan teknologi, globalisasi yang memungkinkan cepatnya arus perubahan dan mobilitas antar- dan lintas sektor serta tempat, era informasi, pengaruh globalisasi terhadap perubahan perilaku dan moral manusia, berubahnya kesadaran masyarakat dan orang tua terhadap pendidikan, serta era perdagangan bebas. Tantangan dan peluang itu harus direspons oleh SMP Muhammadiyah Kembaran sehingga visi sekolah diharapkan sesuai dengan arah perkembangan tersebut. Profil Pelajar Pancasila menjadi acuan dalam menyusun visi, misi, dan tujuan sekolah. Visi merupakan cita-cita bersama pada masa mendatang dari warga sekolah yang dirumuskan berdasarkan masukan seluruh warga sekolah.';

export const SCHOOL_VISION = 'PASTI (Prestasi, Akhlak, Sinergi, Teknologi Inovatif).';

export const SCHOOL_MISSIONS = [
  'Menumbuhkembangkan keimanan dan ketakwaan kepada Tuhan Yang Maha Esa melalui kegiatan agama.',
  'Mengimplementasikan Penguatan Pendidikan Karakter (PPK) dalam setiap kegiatan sekolah.',
  'Meningkatkan pembelajaran yang kreatif, inovatif, dan menyenangkan.',
  'Menggali dan mengembangkan potensi murid untuk mewujudkan prestasi akademik maupun nonakademik.',
  'Menciptakan lingkungan sekolah yang bersih, aman, dan nyaman.',
  'Menjalin kerja sama yang harmonis antarwarga sekolah dan lembaga lain yang terkait.',
];

export const DEFAULT_TEACHERS: SchoolTeacher[] = [
  { name: 'Isti Awalia', title: 'S.Pd., M.Pd., Gr.', role: 'Kepala Sekolah', photo_url: '/img/guru/Isti%20KS.jpg' },
  { name: 'Lina Fatimatuz Zahroh', title: 'S.Pd., Gr.', role: 'Guru' },
  { name: 'Puspita Kursiani', title: 'S.Pd., Gr.', role: 'Guru', photo_url: '/img/guru/Puspita%20PKn.jpg' },
  { name: 'Ikhwan Nur Rozak', title: 'S.Kom.', role: 'Guru', photo_url: '/img/guru/Ikhwan%20Informatika.jpg' },
  { name: 'Risa Maghfiroh Aulia Ramadhani', title: 'S.Pd.', role: 'Guru', photo_url: '/img/guru/Risa%20IPA.jpg' },
  { name: 'Al Mukmin', title: 'S.Pd.', role: 'Guru', photo_url: '/img/guru/Mukmin%20PAI%20Ismuba.jpg' },
  { name: 'Cikita Cahya Aprilia', title: 'S.Pd.', role: 'Guru', photo_url: '/img/guru/Cikita%20Bhs%20Indo.jpg' },
  { name: 'Desti Kristiani', title: 'A.Md.', role: 'Tata Usaha', photo_url: '/img/guru/Desti%20TU.jpg' },
  { name: 'Nur Indah Parwitasari', title: 'S.S.', role: 'Guru' },
  { name: 'Agung Wiratmoko', title: 'S.Sos., Gr.', role: 'Guru', photo_url: '/img/guru/Agung%20IPS.jpg' },
];
export const SCHOOL_VISION_CONTEXT_EN = 'The School Operational Curriculum is prepared by each education unit so that educational programs can be adapted to the needs and potential of the school. As an education provider, the school must also consider future developments and challenges, including advances in science and technology, globalization that accelerates change and mobility across sectors and places, the information era, the influence of globalization on human behavior and morals, changing awareness among communities and parents about education, and the free-trade era. SMP Muhammadiyah Kembaran must respond to these challenges and opportunities so that its vision aligns with those developments. The Pancasila Student Profile serves as the reference for formulating the school’s vision, mission, and goals. The vision is a shared aspiration for the future of the school community, formulated from the input of all school members.';

export const SCHOOL_VISION_EN = 'PASTI (Achievement, Character, Synergy, Innovative Technology).';

export const SCHOOL_MISSIONS_EN = [
  'Nurturing faith and devotion to God Almighty through religious activities.',
  'Implementing Character Education Strengthening (PPK) in every school activity.',
  'Improving learning to be creative, innovative, and enjoyable.',
  'Discovering and developing students’ potential to achieve both academic and non-academic excellence.',
  'Creating a clean, safe, and comfortable school environment.',
  'Building harmonious cooperation among the school community and related institutions.',
];
