'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { PrestasiInfo } from '@/lib/prestasi-data';

type PrestasiPhoto = { src: string; info: PrestasiInfo | null };
type ManagedAchievement = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  date_label: string | null;
};

type GalleryItem =
  | { type: 'photo'; key: string; photo: PrestasiPhoto }
  | { type: 'achievement'; key: string; achievement: ManagedAchievement };

const PAGE_SIZE = 6;

export default function PrestasiGallery({ photos }: { photos: PrestasiPhoto[] }) {
  const { t, lang } = useLang();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [achievements, setAchievements] = useState<ManagedAchievement[]>([]);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadAchievements = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,description,image_url,date_label')
        .eq('category', 'Prestasi Siswa')
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Failed to load school achievements:', error);
        setLoadError(true);
        return;
      }

      setAchievements(data || []);
      setAchievementsLoaded(true);
    };

    void loadAchievements();
    return () => {
      cancelled = true;
    };
  }, []);

  const items: GalleryItem[] = achievementsLoaded
    ? achievements.map((achievement) => ({ type: 'achievement' as const, key: achievement.id, achievement }))
    : photos.map((photo) => ({ type: 'photo' as const, key: photo.src, photo }));

  if (!items.length) {
    return (
      <p className="border border-white/70 bg-white/50 p-10 text-center text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        {t('Belum ada prestasi.', 'No achievements yet.')}
      </p>
    );
  }

  const hasMore = visible < items.length;
  const pick = (text: { id: string; en: string }) => (lang === 'en' ? text.en : text.id);

  return (
    <>
      {loadError && <p role="status" className="mb-6 text-center text-sm text-amber-700 dark:text-amber-300">{t('Sebagian prestasi terbaru gagal dimuat.', 'Some recent achievements could not be loaded.')}</p>}
      <p className="rise-in mx-auto mb-10 w-fit border border-white/70 bg-white/45 px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-600 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        {items.length} {t('Prestasi & Kegiatan', 'Achievements & Activities')}
      </p>

      <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        {items.slice(0, visible).map((item) => item.type === 'photo' ? (
          <li key={item.key}>
            <article className="grid h-full overflow-hidden bg-white shadow-[0_14px_36px_-20px_rgba(15,23,42,0.55)] dark:bg-slate-900 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="relative aspect-[4/5] overflow-hidden bg-transparent sm:aspect-auto sm:min-h-[18rem]">
                <img src={item.photo.src} alt="" loading="lazy" className="h-full w-full object-contain" />
              </div>

              <section className="flex min-w-0 flex-col justify-center gap-3 bg-transparent p-4 text-slate-950 dark:text-white sm:p-5">
                {item.photo.info ? (
                  <>
                    <span className="w-fit border border-white/70 bg-white/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                      {pick(item.photo.info.badge)}
                    </span>
                    <div>
                      <h2 className="text-lg font-black leading-snug sm:text-xl">{pick(item.photo.info.title)}</h2>
                      <p className="mt-1.5 text-xs leading-5 text-slate-700 dark:text-slate-300 sm:text-sm">{pick(item.photo.info.event)}</p>
                    </div>
                    <div className="space-y-2 border border-white/80 bg-white/75 p-3 text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                      <dl className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs sm:text-sm">
                        <dt className="font-bold text-slate-500 dark:text-slate-400">{t('Nama', 'Name')}</dt>
                        <dd className="min-w-0 break-words font-semibold leading-5">{pick(item.photo.info.name)}</dd>
                        {item.photo.info.grade && (
                          <>
                            <dt className="font-bold text-slate-500 dark:text-slate-400">{t('Kelas', 'Grade')}</dt>
                            <dd className="font-semibold leading-5">{item.photo.info.grade}</dd>
                          </>
                        )}
                      </dl>
                      {item.photo.info.detail && (
                        <p className="border-t border-slate-200 pt-2 text-xs leading-5 text-slate-600 dark:border-white/10 dark:text-slate-300">
                          {pick(item.photo.info.detail)}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="border border-white/80 bg-white/75 p-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                    {t('Informasi kejuaraan belum tersedia.', 'Championship details are not available yet.')}
                  </p>
                )}
              </section>
            </article>
          </li>
        ) : (
          <li key={item.key}>
            <article className="grid h-full overflow-hidden bg-white shadow-[0_14px_36px_-20px_rgba(15,23,42,0.55)] dark:bg-slate-900 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="relative aspect-[4/5] overflow-hidden bg-transparent sm:aspect-auto sm:min-h-[18rem]">
                {item.achievement.image_url ? (
                  <img src={item.achievement.image_url} alt="" loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400">{t('Prestasi Siswa', 'Student Achievement')}</div>
                )}
              </div>
              <section className="flex min-w-0 flex-col justify-center gap-3 p-4 text-slate-950 dark:text-white sm:p-5">
                <span className="w-fit border border-white/70 bg-white/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                  {t('Prestasi Siswa', 'Student Achievement')}
                </span>
                <h2 className="text-lg font-black leading-snug sm:text-xl">{item.achievement.title}</h2>
                <p className="text-xs leading-5 text-slate-700 dark:text-slate-300 sm:text-sm">{item.achievement.description}</p>
                {item.achievement.date_label && <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">{item.achievement.date_label}</p>}
              </section>
            </article>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="group inline-flex items-center gap-3 border border-white/70 bg-white/55 px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-900 backdrop-blur-2xl transition-colors hover:bg-white/80 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
          >
            {t('Lainnya', 'More')}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
      )}
    </>
  );
}
