export type SchoolTeacher = {
  id?: string;
  name: string;
  title?: string;
  role: string;
  photo_url?: string;
  sort_order?: number;
};

export const HEADMASTER_NAME = 'Isti Awalia, S.Pd., M.Pd., Gr.';

export type SchoolFacility = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

export const DEFAULT_FACILITIES: SchoolFacility[] = [
  {
    id: 'classroom',
    name: 'Ruang Kelas',
    description: 'Ruang belajar untuk kegiatan pembelajaran sehari-hari.',
    image_url: '/img/bahan/IMG_0658.jpeg',
  },
  {
    id: 'literacy-room',
    name: 'Ruang Literasi',
    description: 'Area membaca dengan koleksi buku yang dapat dimanfaatkan siswa untuk belajar.',
    image_url: '/img/bahan/IMG_0635.jpeg',
  },
  {
    id: 'teachers-room',
    name: 'Ruang Guru',
    description: 'Ruang kerja tenaga pendidik dan kependidikan untuk menyiapkan kegiatan sekolah.',
    image_url: '/img/bahan/IMG_0674.jpeg',
  },
  {
    id: 'principal-office',
    name: 'Ruang Kepala Sekolah',
    description: 'Ruang kerja kepala sekolah untuk mendukung koordinasi kegiatan sekolah.',
    image_url: '/img/bahan/IMG_0643.jpeg',
  },
  {
    id: 'administration-office',
    name: 'Ruang Tata Usaha',
    description: 'Ruang pelayanan administrasi dan pengelolaan tata usaha sekolah.',
    image_url: '/img/bahan/IMG_0690.jpeg',
  },
  {
    id: 'multimedia-room',
    name: 'Ruang Multimedia',
    description: 'Ruang pembelajaran yang dilengkapi layar interaktif.',
    image_url: '/img/bahan/IMG_0645.jpeg',
  },
  {
    id: 'school-field',
    name: 'Lapangan',
    description: 'Area lapangan sekolah untuk mendukung kegiatan olahraga dan aktivitas siswa.',
    image_url: '/img/bahan/IMG_0664.jpeg',
  },
];

export function mergeDefaultFacilities<T extends { name: string }>(facilities: T[]): Array<T | SchoolFacility> {
  return facilities.length > 0 ? facilities : DEFAULT_FACILITIES;
}

export type SchoolExtracurricular = {
  id: string;
  name: string;
  badge: string;
  tag: string;
  description: string;
  image_url: string | null;
};

export const DEFAULT_EXTRACURRICULARS: SchoolExtracurricular[] = [
  {
    id: 'english-club',
    name: 'English Club',
    badge: 'EC',
    tag: 'BAHASA',
    description: 'Kegiatan untuk melatih kemampuan berbahasa Inggris, komunikasi, dan kepercayaan diri siswa.',
    image_url: null,
  },
  {
    id: 'ipm',
    name: 'Ikatan Pelajar Muhammadiyah (IPM)',
    badge: 'IPM',
    tag: 'ORGANISASI',
    description: 'Organisasi pelajar Muhammadiyah untuk mengembangkan kepemimpinan, tanggung jawab, dan dakwah siswa.',
    image_url: null,
  },
  {
    id: 'tapak-suci',
    name: 'Tapak Suci',
    badge: 'TS',
    tag: 'BELA DIRI',
    description: 'Kegiatan bela diri pencak silat untuk membina disiplin, kebugaran, dan karakter siswa.',
    image_url: null,
  },
  {
    id: 'hizbul-wathan',
    name: 'Hizbul Wathan',
    badge: 'HW',
    tag: 'KEPANDUAN',
    description: 'Kegiatan kepanduan untuk melatih kemandirian, kepemimpinan, dan ketangkasan siswa.',
    image_url: null,
  },
  {
    id: 'tahsin',
    name: 'Tahsin',
    badge: 'T',
    tag: 'KEAGAMAAN',
    description: 'Kegiatan untuk memperbaiki bacaan Al-Qur’an sesuai kaidah tajwid.',
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
