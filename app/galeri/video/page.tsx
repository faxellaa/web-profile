'use client';

import { Play } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import VideoGallery from '@/app/components/VideoGallery';

export default function VideoPage() {
  const { t } = useLang();

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/35 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[32rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-32 pt-32 sm:pt-40">
        <header className="mb-10 max-w-3xl border-b border-slate-300/60 pb-7 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            {t('Dokumentasi SMP Muhammadiyah Kembaran', 'SMP Muhammadiyah Kembaran Documentation')}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            {t('Galeri Video', 'Video Gallery')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            {t(
              'Saksikan dokumentasi kegiatan dan informasi sekolah melalui kanal YouTube resmi.',
              'Watch school activities and updates on the official YouTube channel.',
            )}
          </p>
        </header>

        <section className="border border-white/70 bg-linear-to-br from-sky-200/55 via-white/55 to-violet-200/50 p-5 shadow-[0_20px_60px_-40px_rgba(56,189,248,0.55)] backdrop-blur-2xl dark:border-white/10 dark:from-sky-500/15 dark:via-white/[0.04] dark:to-indigo-500/10 sm:p-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center border border-white/70 bg-white/60 text-sky-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-sky-300">
              <Play aria-hidden="true" className="h-7 w-7 fill-current" />
            </span>
            <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white sm:text-2xl">
              {t('Video sekolah', 'School videos')}
            </h2>
            <div className="mt-6 w-full">
              <VideoGallery />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
