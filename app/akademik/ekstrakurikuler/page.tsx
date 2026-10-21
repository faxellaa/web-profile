'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Extracurricular = {
  id: string;
  name: string;
  badge: string | null;
  tag: string | null;
  description: string;
  image_url: string | null;
};

export default function ExtracurricularsPage() {
  const { t } = useLang();
  const [activities, setActivities] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select('id, name, badge, tag, description, image_url');

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load extracurricular activities:', error);
        setLoadError(true);
      } else {
        setActivities(data ?? []);
      }
      setLoading(false);
    }

    void loadActivities();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/35 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[32rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-32 pt-32 sm:pt-40">
        <header className="max-w-3xl border-b border-slate-300/60 pb-7 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            {t('Akademik & Pengembangan Diri', 'Academics & Personal Development')}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            {t('Ekstrakurikuler', 'Extracurriculars')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            {t(
              'Beragam kegiatan untuk mengembangkan minat, bakat, kreativitas, dan kepemimpinan siswa.',
              'Activities to develop students’ interests, talents, creativity, and leadership.',
            )}
          </p>
        </header>

        {loading ? (
          <p role="status" className="mt-10 border border-white/70 bg-white/45 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            {t('Memuat ekstrakurikuler...', 'Loading extracurriculars...')}
          </p>
        ) : loadError ? (
          <p role="alert" className="mt-10 border border-rose-600/30 bg-rose-500/10 p-6 text-sm text-rose-800 dark:text-rose-300">
            {t('Daftar ekstrakurikuler belum dapat dimuat. Silakan coba lagi nanti.', 'Extracurriculars could not be loaded. Please try again later.')}
          </p>
        ) : activities.length === 0 ? (
          <p className="mt-10 border border-white/70 bg-white/45 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            {t('Informasi ekstrakurikuler belum tersedia.', 'Extracurricular information is not available yet.')}
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <article
                key={activity.id}
                className="group overflow-hidden border border-white/70 bg-white/45 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-2xl transition-colors duration-300 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.09]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-900">
                  {activity.image_url ? (
                    <img src={activity.image_url} alt={activity.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-linear-to-br from-sky-100 via-white to-violet-100 text-sky-700 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 dark:text-sky-300">
                      <span className="flex h-20 w-20 items-center justify-center border border-current/20 text-2xl font-black">
                        {activity.badge || <Sparkles aria-hidden="true" className="h-8 w-8" />}
                      </span>
                    </div>
                  )}
                  {activity.tag && (
                    <span className="absolute left-3 top-3 border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-800 backdrop-blur dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-200">
                      {activity.tag}
                    </span>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">{activity.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{activity.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
