"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useLang } from '@/lib/i18n';
import { SCHOOL_MISSIONS, SCHOOL_MISSIONS_EN, SCHOOL_VISION, SCHOOL_VISION_CONTEXT, SCHOOL_VISION_CONTEXT_EN, SCHOOL_VISION_EN } from '@/lib/school-content';

// Tambahkan 1-5 foto di public/img lalu daftarkan path-nya di sini.
const HERO_SLIDES = [
  { src: '/img/profil-hero-1.jpeg', alt: 'Tampak depan area masuk SMP Muhammadiyah Kembaran' },
  { src: '/img/profil-hero-2.jpeg', alt: 'Gedung SMP Muhammadiyah Kembaran dari seberang jalan' },
  { src: '/img/profil-hero-3.jpeg', alt: 'Papan nama SMP Muhammadiyah Kembaran' },
];

const AUTOPLAY_MS = 5000;

type PanelKey = 'visi' | 'misi';

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, shown] as const;
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, shown] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none ${shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 motion-reduce:opacity-100'} ${className}`}
    >
      {children}
    </div>
  );
}

// Teks muncul kata demi kata dari bawah garis saat masuk layar / halaman dimuat.
function SplitText({ text, as: Tag = 'span', className = '', delay = 0 }: { text: string; as?: ElementType; className?: string; delay?: number }) {
  const [ref, shown] = useInView<HTMLElement>();
  return (
    <Tag ref={ref} aria-label={text} className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <span
            style={{ transitionDelay: `${delay + i * 24}ms` }}
            className={`inline-block transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${shown ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'}`}
          >
            {word}
          </span>
          {i < text.split(' ').length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  );
}

function HeroSlider() {
  const { t } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = HERO_SLIDES.length;

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (index + total) % total;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    track.scrollTo({ left: next * track.clientWidth, behavior });
  }, [total]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  useEffect(() => {
    if (total < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => goTo(active + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [active, paused, total, goTo]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('Foto SMP Muhammadiyah Kembaran', 'Photos of SMP Muhammadiyah Kembaran')}
      className="group relative h-[68svh] min-h-[420px] max-h-[760px] w-full overflow-hidden bg-slate-950 sm:h-[78vh] sm:min-h-[480px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {HERO_SLIDES.map((slide, i) => (
          <div key={slide.src} className="relative h-full w-full shrink-0 snap-center" aria-hidden={i !== active}>
            <img src={slide.src} alt={slide.alt} className="h-full w-full object-cover" draggable={false} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/25 to-slate-950/40" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-16 text-white sm:pb-20">
        <SplitText as="p" text="Kramat, Kembaran, Banyumas" className="block text-xs font-bold uppercase tracking-[0.25em] text-sky-300" />
        <SplitText as="h1" text={t('Membentuk generasi berprestasi dan berakhlak mulia.', 'Shaping a high-achieving generation with noble character.')} delay={250} className="mt-3 block max-w-3xl text-3xl font-black leading-tight sm:text-5xl" />
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label={t('Foto sebelumnya', 'Previous photo')}
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-slate-950/40 text-white opacity-100 backdrop-blur transition-colors hover:bg-white hover:text-slate-950 sm:left-6 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label={t('Foto berikutnya', 'Next photo')}
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/30 bg-slate-950/40 text-white opacity-100 backdrop-blur transition-colors hover:bg-white hover:text-slate-950 sm:right-6 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {HERO_SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${t('Ke foto', 'Go to photo')} ${i + 1}`}
                aria-current={i === active}
                className={`h-1 transition-all duration-300 ${i === active ? 'w-10 bg-white' : 'w-5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AccordionPanel({
  id,
  number,
  title,
  open,
  onToggle,
  children,
}: {
  id: PanelKey;
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

export default function ProfilPage() {
  const { lang, t } = useLang();
  const [openPanel, setOpenPanel] = useState<PanelKey[]>([]);

  const togglePanel = (panel: PanelKey) => setOpenPanel((current) => (current.includes(panel) ? current.filter((item) => item !== panel) : [...current, panel]));

  return (
    <div className="relative overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <HeroSlider />

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[78vh] -z-0 h-[900px]">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-80 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute left-1/3 top-[620px] h-80 w-80 rounded-full bg-teal-200/40 blur-3xl dark:bg-blue-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl space-y-20 px-4 pb-32 pt-16 sm:space-y-28 sm:pt-24">
        <section className="grid items-center gap-10 md:grid-cols-[1fr_auto] md:gap-16">
          <div>
            <SplitText as="p" text={t('Tentang Kami', 'About Us')} className="block text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400" />
            <SplitText as="h2" text={t('Profil Sekolah', 'School Profile')} delay={120} className="mt-3 block text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl" />
            <Reveal delay={300} className="mt-6 max-w-2xl space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              <p>
                {lang === 'en' ? 'SMP Muhammadiyah Kembaran is a junior high school under the Muhammadiyah Council for Primary and Secondary Education, located in Kramat, Kembaran, Banyumas. The school is here to guide students to grow into people who are faithful, intelligent, and of good character.' : 'SMP Muhammadiyah Kembaran adalah lembaga pendidikan tingkat menengah pertama di bawah naungan Majelis Dikdasmen Muhammadiyah, berlokasi di Kramat, Kembaran, Banyumas. Sekolah ini hadir untuk mendampingi peserta didik tumbuh menjadi pribadi yang beriman, cerdas, dan berkarakter.'}
              </p>
              <p>
                {lang === 'en' ? 'With the PASTI spirit — Achievement, Character, Synergy, Technology, and Innovation — we combine creative and enjoyable learning, the strengthening of Islamic character in daily life, and a clean, safe, and comfortable environment, so every student can discover their potential in both academic and non-academic fields and be ready to compete globally.' : 'Dengan semangat PASTI — Prestasi, Akhlak, Sinergi, Teknologi, dan Inovatif — kami memadukan pembelajaran yang kreatif dan menyenangkan, penguatan karakter Islami dalam keseharian, serta lingkungan yang bersih, aman, dan nyaman, agar setiap murid mampu menggali potensinya baik di bidang akademik maupun nonakademik dan siap berdaya saing global.'}
              </p>
            </Reveal>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t('Akreditasi', 'Accreditation'), value: t('Terakreditasi B', 'Accredited B') },
                { label: t('Kurikulum', 'Curriculum'), value: 'Merdeka & Ismuba' },
                { label: t('Ekstrakurikuler', 'Extracurriculars'), value: `4+ ${t('Pilihan', 'Options')}` },
                { label: t('Lokasi', 'Location'), value: 'Kembaran, Banyumas' },
              ].map((item, i) => (
                <Reveal key={item.label} delay={450 + i * 90}>
                  <div className="h-full border border-white/70 bg-white/45 px-4 py-3 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-colors duration-300 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.09]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{item.value}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Panel kaca terang agar logo tetap terbaca di mode gelap */}
          <Reveal delay={300} className="mx-auto md:mx-0"><div className="mx-auto flex h-52 w-52 items-center justify-center border border-white/80 bg-white/85 p-6 shadow-[0_30px_70px_-30px_rgba(56,189,248,0.5)] backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-1 dark:border-white/30 dark:bg-white/90 dark:shadow-[0_0_80px_-20px_rgba(125,211,252,0.35)] md:mx-0 md:h-60 md:w-60">
            <img src="/img/pasti.png" alt={t('PASTI: Prestasi, Akhlak, Sinergi, Teknologi Inovatif', 'PASTI: Achievement, Character, Synergy, Innovative Technology')} className="h-auto max-h-full w-full object-contain" />
          </div></Reveal>
        </section>

        <section>
          <div className="space-y-5">
            <Reveal><AccordionPanel id="visi" number="01" title={t('VISI', 'VISION')} open={openPanel.includes('visi')} onToggle={() => togglePanel('visi')}>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{lang === 'en' ? SCHOOL_VISION_CONTEXT_EN : SCHOOL_VISION_CONTEXT}</p>
              <p className="border-l-2 border-slate-400/60 pl-4 text-base font-semibold leading-7 text-slate-950 dark:border-white/30 dark:text-white">
                {t('Visi SMP Muhammadiyah Kembaran:', 'Vision of SMP Muhammadiyah Kembaran:')} {lang === 'en' ? SCHOOL_VISION_EN : SCHOOL_VISION}
              </p>
            </AccordionPanel></Reveal>

            <Reveal delay={120}><AccordionPanel id="misi" number="02" title={t('MISI', 'MISSION')} open={openPanel.includes('misi')} onToggle={() => togglePanel('misi')}>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {t('Untuk mewujudkan visi tersebut, sekolah menjalankan misi berdasarkan masukan seluruh warga sekolah:', 'To realize this vision, the school carries out its mission based on input from all school members:')}
              </p>
              <ol className="space-y-3">
                {(lang === 'en' ? SCHOOL_MISSIONS_EN : SCHOOL_MISSIONS).map((mission, i) => (
                  <li key={mission} className="flex gap-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    <span className="font-mono font-semibold text-slate-400 dark:text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                    <span>{mission}</span>
                  </li>
                ))}
              </ol>
            </AccordionPanel></Reveal>
          </div>
        </section>
      </main>
    </div>
  );
}
