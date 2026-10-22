'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FileText, UserRoundPlus } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { DEFAULT_TEACHERS, HEADMASTER_NAME, SCHOOL_MISSIONS, SCHOOL_MISSIONS_EN, SCHOOL_VISION, SCHOOL_VISION_CONTEXT, SCHOOL_VISION_CONTEXT_EN, SCHOOL_VISION_EN, type SchoolTeacher } from '@/lib/school-content';
import { WA_ADMIN_URL } from '@/lib/site-links';

type VisitorAnalytics = {
  total_visits: number;
  today_visits: number;
};

type HomeArticle = {
  title: string;
  category: string;
  description: string;
  image_url?: string;
  date_label?: string;
};

type HomeActivity = {
  name: string;
  tag?: string;
  badge?: string;
  description: string;
  image_url?: string;
};

type HomeFacility = {
  name: string;
  description: string;
  image_url?: string;
};

const toVisitorStats = (record: VisitorAnalytics) => ({
  total: Number(record.total_visits || 0),
  today: Number(record.today_visits || 0),
});

const getLastSevenDays = (locale: string) => {
  const todayParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const parts = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
  const today = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  const labelFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - 6 + index);
    return { date: date.toISOString().slice(0, 10), label: labelFormatter.format(date) };
  });
};

const PRESTASI_PREVIEW = [
  'WhatsApp Image 2026-10-11 at 16.15.26.jpeg',
  'WhatsApp Image 2026-10-11 at 16.15.27.jpeg',
  'WhatsApp Image 2026-10-11 at 16.15.28.jpeg',
  'WhatsApp Image 2026-10-11 at 16.16.05.jpeg',
]

const HEADMASTER_SPEECH_EN = `"Assalamu'alaikum Warahmatullahi Wabarakatuh, good morning and warm greetings to all of us.

Welcome to the official website of SMP Muhammadiyah Kembaran, a place for information, communication, and transparency for the entire community. In this digital era, we are committed to using technology to support learning that is innovative, safe, and character-building, so we can nurture a high-achieving generation.

Through this site, you can quickly and accurately access our academic programs, achievements, and school activities. We invite all teachers, students, parents, and alumni to keep working together for the advancement of education in this institution we love.

Thank you for your visit, and let us write achievements together for the bright future of our nation. Wassalamu'alaikum Warahmatullahi Wabarakatuh."`;

const glass =
  'border border-white/70 bg-white/45 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]';
const glassHover =
  'transition-colors duration-300 hover:bg-white/70 dark:hover:bg-white/[0.09]';

type HomePanelKey = 'visi' | 'misi';

function HomeAccordionPanel({
  id,
  number,
  title,
  open,
  onToggle,
  children,
}: {
  id: HomePanelKey;
  number: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`group/panel border backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-300 ${
        open
          ? 'border-white/80 bg-white/70 shadow-[0_24px_60px_-28px_rgba(30,64,175,0.35)] dark:border-white/20 dark:bg-white/[0.07] dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)]'
          : 'border-white/70 bg-white/45 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.4)] hover:-translate-y-0.5 hover:bg-white/65 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.07]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center gap-5 px-6 py-7 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-8 sm:py-9"
      >
        <span className="font-mono text-sm font-semibold text-slate-400 dark:text-slate-500">{number}</span>
        <span className="flex-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">{title}</span>
        <span
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center border backdrop-blur transition-colors duration-300 ${
            open
              ? 'rotate-180 border-white/80 bg-white/80 text-slate-800 dark:border-white/25 dark:bg-white/15 dark:text-white'
              : 'border-white/70 bg-white/40 text-slate-600 group-hover/panel:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:group-hover/panel:bg-white/10'
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>

      <div id={`${id}-panel`} className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-slate-300/40 px-6 pb-8 pt-6 sm:px-8 sm:pl-[4.5rem]">
            {children}
          </div>
        </div>
      </div>
    </article>
  );
}

function SectionHead({ label, title, desc, children }: { label: string; title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-10 flex flex-col justify-between gap-5 border-b border-slate-300/60 pb-6 dark:border-white/10 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{label}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">{title}</h2>
        {desc && <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{desc}</p>}
      </div>
      {children}
    </header>
  );
}

const carouselControl =
  'inline-flex items-center justify-center rounded-lg border border-white/70 bg-white/45 px-3 py-2 text-xs font-semibold text-slate-800 backdrop-blur-2xl transition-colors duration-200 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/15';

export default function HomePage() {
  const { lang, t } = useLang();

  const saranaScrollRef = useRef<HTMLDivElement>(null);
  const teacherScrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // State Membaca Langsung dari Supabase
  const [dbArticles, setDbArticles] = useState<HomeArticle[]>([]);
  const [dbEkskuls, setDbEkskuls] = useState<HomeActivity[]>([]);
  const [dbFacilities, setDbFacilities] = useState<HomeFacility[]>([]);
  const [dbTeachers, setDbTeachers] = useState<SchoolTeacher[]>([]);
  const [openPanels, setOpenPanels] = useState<HomePanelKey[]>([]);
  const [dbStats, setDbStats] = useState({
    headmaster_name: HEADMASTER_NAME,
    speech: '',
    photo_url: '/img/guru/Isti%20KS.jpg',
  });

  // Starts empty so demo values are never presented as real traffic.
  const [visitorStats, setVisitorStats] = useState({
    total: 0,
    today: 0,
  });
  const [dailyVisits, setDailyVisits] = useState<Record<string, number>>({});
  const [hasVisitorData, setHasVisitorData] = useState(false);
  const [hasWeeklyVisitorData, setHasWeeklyVisitorData] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1. Berita (prestasi ditampilkan di halaman tersendiri)
      const { data: art } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
      if (art && art.length > 0) setDbArticles(art.filter((article) => article.category !== 'Prestasi Siswa'));

      // 2. Ekskul
      const { data: eks } = await supabase.from('extracurriculars').select('*').order('created_at', { ascending: false });
      if (eks && eks.length > 0) setDbEkskuls(eks);

      // 3. Sarana
      const { data: fac } = await supabase.from('facilities').select('*');
      if (fac && fac.length > 0) setDbFacilities(fac);

      // 4. Guru
      const { data: teachers } = await supabase.from('teachers').select('*').order('sort_order').order('name');
      if (teachers && teachers.length > 0) setDbTeachers(teachers);

      // 5. Sambutan kepala sekolah
      const { data: st } = await supabase.from('school_stats').select('*').limit(1).single();
      if (st) {
        setDbStats({
          headmaster_name: HEADMASTER_NAME,
          speech: st.headmaster_speech || '',
          photo_url: st.headmaster_photo_url || '/img/guru/Isti%20KS.jpg',
        });
      }

    }
    fetchData();
  }, []);

  useEffect(() => {
    const loadWeeklyVisits = async () => {
      const { data, error } = await supabase.rpc('get_site_weekly_visits');
      if (error) {
        console.error('Failed to load the weekly visitor trend:', error);
        setHasWeeklyVisitorData(false);
        return;
      }
      setDailyVisits(data || {});
      setHasWeeklyVisitorData(true);
    };

    const loadCurrentAnalytics = async () => {
      const { data, error } = await supabase
        .from('site_analytics_realtime')
        .select('*')
        .eq('id', true)
        .maybeSingle();
      if (error) {
        console.error('Failed to load visitor statistics:', error);
      } else if (data) {
        setVisitorStats(toVisitorStats(data));
        setHasVisitorData(true);
      }
      await loadWeeklyVisits();
    };

    const channel = supabase
      .channel('site-analytics-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_analytics_realtime' }, (payload) => {
        const record = payload.new as unknown as VisitorAnalytics;
        if ('total_visits' in record) {
          setVisitorStats(toVisitorStats(record));
          setHasVisitorData(true);
          void loadWeeklyVisits();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void loadCurrentAnalytics();
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    root.classList.add('has-reveal');

    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return () => root.classList.remove('has-reveal');
    }
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return () => root.classList.remove('has-reveal');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      root.classList.remove('has-reveal');
    };
  }, []);

  const scrollSarana = (direction: 'left' | 'right') => {
    if (saranaScrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      saranaScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Fallback jika belum diinput di admin
  const defaultEkskuls = [
    { badge: 'HW', tag: 'KEPANDUAN', name: 'Hizbul Wathan (HW)', description: 'Membentuk kemandirian, kepemimpinan, dan ketangkasan hidup.', image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80' },
    { badge: 'TS', tag: 'BELA DIRI', name: 'Tapak Suci Putra Muh.', description: 'Seni bela diri islami dengan ragam prestasi kejuaraan.', image_url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&auto=format&fit=crop&q=80' },
    { badge: 'IPM', tag: 'ORGANISASI', name: 'Ikatan Pelajar Muh. (IPM)', description: 'Wadah kepemimpinan, nalar dakwah, dan keorganisasian siswa.', image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80' },
    { badge: 'FS', tag: 'FUTSAL', name: 'Futsal & Olahraga', description: 'Mengasah kerja sama tim, stamina fisik, dan sportivitas.', image_url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&auto=format&fit=crop&q=80' },
  ];

  const defaultFacilities = [
    { name: 'Laboratorium Komputer', description: 'Fasilitas PC modern dan internet stabil untuk ujian CBT dan kelas TIK.', image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80' },
    { name: 'Masjid & Sarana Ibadah', description: 'Tempat pembiasaan sholat berjamaah dan kajian keislaman siswa.', image_url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&auto=format&fit=crop&q=80' },
    { name: 'Ruang Kelas Nyaman', description: 'Ruang belajar berorientasi kenyamanan dengan ventilasi udara ideal.', image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80' },
    { name: 'Perpustakaan & Literasi', description: 'Koleksi buku kurikulum, keislaman, fiksi ilmiah, dan ensiklopedia.', image_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop&q=80' },
  ];

  const defaultArticles = [
    { title: 'Pelatihan Guru dalam Pemanfaatan Kurikulum AI Digital', category: 'Kabar Pendidik', date_label: 'Juli 2026', description: 'Meningkatkan kompetensi tenaga pendidik dalam integrasi media kurikulum digital berkemajuan.', image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80' },
    { title: 'Kemah Akbar Kepanduan Hizbul Wathan Siswa Baru', category: 'Kegiatan Siswa', date_label: 'Juni 2026', description: 'Melatih ketangkasan, kemandirian, dan solidaritas sosial peserta didik di bumi perkemahan.', image_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80' },
  ];

  const displayEkskuls = dbEkskuls.length > 0 ? dbEkskuls : defaultEkskuls;
  const displayFacilities = dbFacilities.length > 0 ? dbFacilities : defaultFacilities;
  const displayArticles = dbArticles.length > 0 ? dbArticles : defaultArticles;
  const displayTeachers = dbTeachers.length > 0 ? dbTeachers : DEFAULT_TEACHERS;

  const togglePanel = (panel: HomePanelKey) => {
    setOpenPanels((current) => (current.includes(panel) ? current.filter((item) => item !== panel) : [...current, panel]));
  };

  const scrollTeachers = (direction: -1 | 1) => {
    teacherScrollRef.current?.scrollBy({ left: direction * 288, behavior: 'smooth' });
  };

  const weeklyTrend = getLastSevenDays(lang).map(({ date, label }) => ({
    date,
    label,
    count: Number(dailyVisits[date] || 0),
  }));
  const weeklyTotal = weeklyTrend.reduce((total, day) => total + day.count, 0);
  const maxWeeklyCount = Math.max(...weeklyTrend.map((day) => day.count), 1);

  return (
    <div ref={pageRef} className="relative overflow-x-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 pb-32 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[85vh] h-[2400px]">
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[40rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute -left-24 top-[90rem] h-[28rem] w-[28rem] rounded-full bg-teal-200/40 blur-3xl dark:bg-blue-500/15" />
        <div className="absolute -right-32 top-[140rem] h-[28rem] w-[28rem] rounded-full bg-sky-300/30 blur-3xl dark:bg-indigo-600/15" />
      </div>

      {/* 1. HERO */}
      <section className="relative h-[85vh] min-h-[520px] w-full overflow-hidden bg-slate-950">
        <img src="/img/smpkemuhprofil.jpeg" alt="SMP Muhammadiyah Kembaran" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-center px-4 pb-24 text-center text-white sm:pb-28">
          <div className="rise-in max-w-3xl [text-shadow:0_1px_12px_rgba(0,0,0,0.55)]">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white">{t('Selamat Datang di Website Resmi','Welcome to the Official Website')}</p>
            <h1 className="mt-3 text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              SMP Muhammadiyah Kembaran
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white sm:text-base sm:leading-7">
              {t('Mewujudkan generasi peserta didik yang unggul dalam ilmu pengetahuan, teguh dalam akidah Islam, mandiri, dan berakhlakul karimah.','Nurturing students who excel in knowledge, stand firm in Islamic faith, and grow independent with noble character.')}
            </p>
          </div>
        </div>
      </section>

      {/* Fakta singkat */}
      <section className="relative z-10 mx-auto mt-8 max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: t('Akreditasi','Accreditation'), val: t('Terakreditasi B','Accredited B') },
            { label: t('Kurikulum','Curriculum'), val: 'Merdeka & Ismuba' },
            { label: t('Ekstrakurikuler','Extracurriculars'), val: `${displayEkskuls.length}+ ${t('Pilihan','Options')}` },
            { label: t('Lokasi','Location'), val: 'Kembaran, Banyumas' },
          ].map((item, index) => (
            <div key={item.label} data-reveal className="profile-card-reveal" style={{ transitionDelay: `${450 + index * 90}ms` }}>
              <div className="h-full border border-white/90 bg-white/90 px-4 py-3 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-colors duration-300 hover:bg-white dark:border-white/15 dark:bg-slate-950/85 dark:hover:bg-slate-950">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{item.val}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. SAMBUTAN */}
      <section id="sambutan" data-reveal className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32">
        <SectionHead label={t('Pesan Pimpinan','Message from the Head')} title={t('Sambutan Kepala Sekolah','Headmaster’s Welcome')} />
        <div className={`grid w-full overflow-hidden md:grid-cols-[200px_1fr] ${glass}`}>
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-200 dark:bg-slate-900 md:aspect-auto">
            {dbStats.photo_url ? (
              <img src={dbStats.photo_url} alt={dbStats.headmaster_name} className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-sky-200/70 via-white to-violet-200/60 text-7xl font-black text-slate-500 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-400">{dbStats.headmaster_name.charAt(0)}</div>
            )}
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
              {lang === 'en' && (!dbStats.speech || dbStats.speech.includes('Selamat pagi dan salam sejahtera')) ? HEADMASTER_SPEECH_EN : dbStats.speech || 'Assalamu’alaikum Warahmatullahi Wabarakatuh. Selamat datang di website resmi SMP Muhammadiyah Kembaran. Mari bersama mendukung pendidikan yang berkarakter, berprestasi, dan berkemajuan. Wassalamu’alaikum Warahmatullahi Wabarakatuh.'}
            </p>
            <div className="mt-5 border-t border-slate-300/60 pt-4 dark:border-white/10">
              <p className="font-black text-slate-950 dark:text-white">{dbStats.headmaster_name}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('Kepala Sekolah SMP Muhammadiyah Kembaran','Headmaster of SMP Muhammadiyah Kembaran')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISI & MISI */}
      <section id="visi-misi" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32">
        <div className="space-y-5">
          <div data-reveal className="profile-card-reveal" style={{ transitionDelay: '0ms' }}>
            <HomeAccordionPanel id="visi" number="01" title={t('VISI', 'VISION')} open={openPanels.includes('visi')} onToggle={() => togglePanel('visi')}>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{lang === 'en' ? SCHOOL_VISION_CONTEXT_EN : SCHOOL_VISION_CONTEXT}</p>
              <p className="border-l-2 border-slate-400/60 pl-4 text-base font-semibold leading-7 text-slate-950 dark:border-white/30 dark:text-white">
                {t('Visi SMP Muhammadiyah Kembaran:', 'Vision of SMP Muhammadiyah Kembaran:')} {lang === 'en' ? SCHOOL_VISION_EN : SCHOOL_VISION}
              </p>
            </HomeAccordionPanel>
          </div>
          <div data-reveal className="profile-card-reveal" style={{ transitionDelay: '180ms' }}>
            <HomeAccordionPanel id="misi" number="02" title={t('MISI', 'MISSION')} open={openPanels.includes('misi')} onToggle={() => togglePanel('misi')}>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {t('Untuk mewujudkan visi tersebut, sekolah menjalankan misi berdasarkan masukan seluruh warga sekolah:', 'To realize this vision, the school carries out its mission based on input from all school members:')}
              </p>
              <ol className="space-y-3">
                {(lang === 'en' ? SCHOOL_MISSIONS_EN : SCHOOL_MISSIONS).map((mission, index) => (
                  <li key={mission} className="flex gap-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <span className="font-mono font-semibold text-slate-400 dark:text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                    <span>{mission}</span>
                  </li>
                ))}
              </ol>
            </HomeAccordionPanel>
          </div>
        </div>
      </section>

      {/* 4. TENAGA KERJA */}
      <section id="guru" data-reveal className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32">
        <SectionHead label={t('Orang-Orang di Balik Sekolah','The People Behind the School')} title={t('Tenaga Kerja','Our Staff')} desc={t('Kenali pendidik yang mendampingi perjalanan belajar siswa.','Meet the educators who guide our students’ learning journey.')}>
          <div className="flex gap-2">
            <button type="button" onClick={() => scrollTeachers(-1)} aria-label={t('Geser daftar guru ke kiri','Scroll staff list left')} className={carouselControl}>{t('Sebelumnya', 'Previous')}</button>
            <button type="button" onClick={() => scrollTeachers(1)} aria-label={t('Geser daftar guru ke kanan','Scroll staff list right')} className={carouselControl}>{t('Berikutnya', 'Next')}</button>
          </div>
        </SectionHead>
        <div ref={teacherScrollRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {displayTeachers.slice(0, 6).map((teacher, index) => (
            <Link href="/guru" key={teacher.id || teacher.name || index} className={`group relative w-48 shrink-0 snap-start overflow-hidden sm:w-56 ${glass} ${glassHover}`}>
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-200 dark:bg-slate-900">
                {teacher.photo_url ? <img src={teacher.photo_url} alt={`${t('Foto','Photo of')} ${teacher.name}`} className="h-full w-full object-cover object-top" /> : <div className="flex h-full items-center justify-center bg-linear-to-br from-sky-200/70 via-white to-violet-200/60 text-6xl font-black text-slate-500 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-400">{teacher.name.charAt(0)}</div>}
                <div className="absolute inset-x-0 bottom-0 bg-white/85 p-3 text-slate-950 backdrop-blur-md dark:bg-slate-950/85 dark:text-white">
                  <h3 className="text-sm font-black leading-tight">{teacher.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-white/80">{teacher.role}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center"><Link href="/guru" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 underline-offset-4 hover:underline dark:text-white">{t('Lihat selengkapnya','See more')}</Link></div>
      </section>

      {/* 5. STATISTIK */}
      <section id="statistik" data-reveal className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32">
        <SectionHead label={t('Lalu Lintas Informasi','Information Traffic')} title={t('Statistik Pengunjung','Visitor Statistics')} desc={t('Ringkasan kunjungan pada halaman publik sekolah.','Summary of visits to the school’s public pages.')}>
          <span className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className={`h-2 w-2 rounded-full ${hasVisitorData ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {hasVisitorData ? 'Realtime' : t('Belum tersedia','Not available')}
          </span>
        </SectionHead>

        {hasVisitorData ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {[
                { label: t('Total Kunjungan','Total Visits'), value: visitorStats.total, note: t('Sejak tracking aktif','Since tracking began') },
                { label: t('Kunjungan 7 Hari','Visits in 7 Days'), value: weeklyTotal, note: t('Total page view 7 hari terakhir','Page views in the last 7 days') },
                { label: t('Kunjungan Hari Ini','Visits Today'), value: visitorStats.today, note: t('Total page view hari ini','Page views today') },
              ].map((stat) => (
                <div key={stat.label} className={`p-6 ${glass} ${glassHover}`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">{stat.value.toLocaleString('id-ID')}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stat.note}</p>
                </div>
              ))}
            </div>

            {hasWeeklyVisitorData ? (
              <div className={`p-6 sm:p-8 ${glass}`}>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">{t('Tren Kunjungan 7 Hari Terakhir', 'Visitor Trend — Last 7 Days')}</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('7 hari terakhir', 'Last 7 days')}</span>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {weeklyTrend.map((item) => {
                    const heightPercent = (item.count / maxWeeklyCount) * 100;
                    return (
                      <div key={item.date} className="flex h-32 min-w-0 flex-col items-center justify-end">
                        <span className="mb-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">{item.count.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}</span>
                        <div className="relative flex h-20 w-full max-w-10 items-end overflow-hidden bg-slate-300/40 dark:bg-white/10">
                          <div className="w-full bg-linear-to-t from-slate-800 to-slate-500 transition-all duration-700 dark:from-sky-400 dark:to-indigo-300" style={{ height: `${Math.max(4, heightPercent)}%` }} />
                        </div>
                        <span className="mt-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-5 text-[11px] text-slate-500 dark:text-slate-400">{t('Setiap perpindahan halaman publik dihitung sebagai satu kunjungan.', 'Each public page view is counted as one visit.')}</p>
              </div>
            ) : (
              <p role="status" className={`p-6 text-sm text-slate-500 dark:text-slate-400 ${glass}`}>
                {t('Tren 7 hari belum tersedia. Terapkan migrasi statistik mingguan di Supabase.', 'The 7-day trend is not available yet. Apply the weekly analytics migration in Supabase.')}
              </p>
            )}
          </div>
        ) : (
          <p className={`p-8 text-sm leading-6 text-slate-500 dark:text-slate-400 ${glass}`}>
            Data kunjungan belum tersedia. Statistik akan muncul setelah pencatatan Supabase diaktifkan.
          </p>
        )}
      </section>

      {/* 6. SARANA & PRASARANA */}
      <section id="sarana" data-reveal className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32">
        <SectionHead label={t('Fasilitas Sekolah','School Facilities')} title={t('Sarana & Prasarana','Facilities')} desc={t('Ruang belajar dan sarana penunjang kegiatan siswa.','Learning spaces and facilities that support student activities.')}>
          <div className="flex items-center gap-3">
            <Link href="/profil/sarana-prasarana" className="text-xs font-bold uppercase tracking-[0.15em] text-slate-900 underline-offset-4 hover:underline dark:text-white">
              {t('Lihat Semua', 'View All')}
            </Link>
            <div className="flex gap-2">
              <button type="button" onClick={() => scrollSarana('left')} aria-label={t('Geser Kiri','Scroll left')} className={carouselControl}>{t('Sebelumnya', 'Previous')}</button>
              <button type="button" onClick={() => scrollSarana('right')} aria-label={t('Geser Kanan','Scroll right')} className={carouselControl}>{t('Berikutnya', 'Next')}</button>
            </div>
          </div>
        </SectionHead>
        <div ref={saranaScrollRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {displayFacilities.map((facility, idx) => (
            <div key={idx} className={`group min-w-72 snap-start overflow-hidden sm:min-w-80 ${glass} ${glassHover}`}>
              <div className="h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
                <img src={facility.image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80'} alt={facility.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="text-sm font-black text-slate-950 dark:text-white">{facility.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{facility.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. EKSTRAKURIKULER */}
      <section id="ekskul" data-reveal className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32">
        <SectionHead label={t('Pengembangan Bakat','Talent Development')} title={t('Ekstrakurikuler','Extracurriculars')} desc={t('Ruang pembinaan minat, kreativitas, dan kepemimpinan siswa.','A space to nurture students’ interests, creativity, and leadership.')}>
          <Link href="/akademik/ekstrakurikuler" className="w-fit text-xs font-bold uppercase tracking-[0.15em] text-slate-900 underline-offset-4 hover:underline dark:text-white">
            {t('Lihat Semua', 'View All')}
          </Link>
        </SectionHead>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
          {displayEkskuls.map((ekskul, idx) => (
            <div key={idx} className={`group flex flex-col overflow-hidden ${glass} ${glassHover}`}>
              <div className="relative h-44 w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
                <img src={ekskul.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80'} alt={ekskul.name} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-800 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200">
                  {ekskul.tag || ekskul.badge || 'KEGIATAN'}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-black text-slate-950 dark:text-white">{ekskul.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{ekskul.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. PRESTASI */}
      <section id="prestasi" data-reveal className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32">
        <SectionHead label={t('Capaian Siswa','Student Success')} title={t('Prestasi','Achievements')} desc={t('Dokumentasi kejuaraan dan pencapaian siswa-siswi kami.','Documentation of our students’ championships and accomplishments.')}>
          <Link href="/prestasi" className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl border border-white/70 bg-white/55 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-900 backdrop-blur-2xl transition-colors duration-200 hover:bg-white/80 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]">
            {t('Lihat Semua','View All')}
          </Link>
        </SectionHead>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {PRESTASI_PREVIEW.map((file, idx) => (
            <Link href="/prestasi" key={file} className={`group block aspect-[4/5] overflow-hidden p-2 ${glass} ${glassHover}`}>
              <img src={`/img/prestasi/${encodeURIComponent(file)}`} alt={`${t('Prestasi siswa','Student achievement')} ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
            </Link>
          ))}
        </div>
      </section>

      <section id="layanan-publik" data-reveal className="relative z-10 mx-auto max-w-6xl px-4 pt-24 sm:pt-32">
        <SectionHead
          label={t('Informasi dan Administrasi', 'Information & Administration')}
          title={t('Layanan Publik', 'Public Services')}
          desc={t(
            'Akses pendaftaran online dan layanan pengiriman surat untuk SMP Muhammadiyah Kembaran.',
            'Access online admissions and letter submission services for SMP Muhammadiyah Kembaran.',
          )}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <article className="min-w-0 border border-white/70 bg-linear-to-br from-sky-200/60 via-white/55 to-cyan-100/50 p-6 shadow-[0_20px_60px_-40px_rgba(56,189,248,0.55)] backdrop-blur-2xl dark:border-white/10 dark:from-sky-500/15 dark:via-white/[0.04] dark:to-cyan-500/10 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center border border-sky-700/20 bg-white/60 text-sky-800 dark:border-white/10 dark:bg-white/[0.08] dark:text-sky-300">
              <UserRoundPlus aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              {t('Pendaftaran Online', 'Online Admission')}
            </h3>
            <p className="mt-3 min-h-14 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {t(
                'Daftarkan calon murid baru melalui formulir pendaftaran online.',
                'Register a new student using the online admission form.',
              )}
            </p>
            <Link
              href="/layanan-publik/spmb-online"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-sky-700 dark:bg-white dark:text-slate-950 dark:hover:bg-sky-200"
            >
              {t('Lihat SPMB Online', 'View Online Admission')}
            </Link>
          </article>

          <article className="min-w-0 border border-white/70 bg-linear-to-br from-violet-200/55 via-white/55 to-indigo-100/50 p-6 shadow-[0_20px_60px_-40px_rgba(139,92,246,0.45)] backdrop-blur-2xl dark:border-white/10 dark:from-violet-500/15 dark:via-white/[0.04] dark:to-indigo-500/10 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center border border-violet-700/20 bg-white/60 text-violet-800 dark:border-white/10 dark:bg-white/[0.08] dark:text-violet-300">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              {t('Surat Masuk', 'Incoming Mail')}
            </h3>
            <p className="mt-3 min-h-14 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {t(
                'Kirim surat atau dokumen kepada pihak SMP Muhammadiyah Kembaran melalui formulir surat masuk.',
                'Send a letter or document to SMP Muhammadiyah Kembaran using the incoming mail form.',
              )}
            </p>
            <Link
              href="/layanan-publik/surat-masuk"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-violet-700 dark:bg-white dark:text-slate-950 dark:hover:bg-violet-200"
            >
              {t('Kirim Surat Masuk', 'Submit Incoming Mail')}
            </Link>
          </article>
        </div>
      </section>

      {/* FLOATING WHATSAPP BUTTON */}
      <aside aria-label={t('Bantuan WhatsApp','WhatsApp Help')} className="group fixed bottom-6 right-6 z-9999">
        <a
          href={WA_ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center gap-2.5 rounded-full border border-white/40 bg-emerald-500 py-3 pl-4 pr-5 text-white shadow-2xl shadow-emerald-700/40 backdrop-blur-md transition-colors duration-200 hover:bg-emerald-600"
        >
          <div className="relative flex items-center justify-center">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span aria-hidden="true" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-semibold text-emerald-100 tracking-wider">{t('Pusat Bantuan','Help Center')}</span>
            <span className="text-xs font-bold leading-none">{t('Chat Admin WA','Chat Admin on WA')}</span>
          </div>
        </a>
      </aside>

    </div>
  );
}
