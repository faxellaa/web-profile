'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { PrestasiInfo } from '@/lib/prestasi-data';
import AchievementCard from './AchievementCard';

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

const PAGE_SIZE = 8;

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
  const pageHeading = (
    <header className="max-w-3xl border-b border-slate-300/60 pb-7 dark:border-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
        {t('Akademik & Pengembangan Diri', 'Academics & Personal Development')}
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
        {t('Prestasi', 'Achievements')}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
        {t(
          'Dokumentasi pencapaian dan kejuaraan siswa SMP Muhammadiyah Kembaran.',
          'A showcase of achievements and championships by SMP Muhammadiyah Kembaran students.',
        )}
      </p>
    </header>
  );

  if (!items.length) {
    return (
      <>
        {pageHeading}
        <p className="mt-10 border border-white/70 bg-white/50 p-10 text-center text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          {t('Belum ada prestasi.', 'No achievements yet.')}
        </p>
      </>
    );
  }

  const hasMore = visible < items.length;
  const pick = (text: { id: string; en: string }) => (lang === 'en' ? text.en : text.id);

  return (
    <>
      {pageHeading}
      {loadError && <p role="status" className="mt-10 text-sm text-amber-700 dark:text-amber-300">{t('Sebagian prestasi terbaru gagal dimuat.', 'Some recent achievements could not be loaded.')}</p>}

      <ul className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, visible).map((item) => item.type === 'photo' ? (
          <li key={item.key} className="min-w-0">
            <AchievementCard
              imageUrl={item.photo.src}
              imageAlt={item.photo.info ? `${pick(item.photo.info.title)} - ${pick(item.photo.info.name)}` : ''}
              badge={item.photo.info ? pick(item.photo.info.badge) : t('Prestasi Siswa', 'Student Achievement')}
              title={item.photo.info ? pick(item.photo.info.title) : t('Prestasi Siswa', 'Student Achievement')}
              event={item.photo.info ? pick(item.photo.info.event) : t('Informasi kejuaraan belum tersedia.', 'Championship details are not available yet.')}
              participant={item.photo.info ? `${pick(item.photo.info.name)}${item.photo.info.grade ? ` · ${t(`Kelas ${item.photo.info.grade}`, `Grade ${item.photo.info.grade}`)}` : ''}` : undefined}
              detail={item.photo.info?.detail ? pick(item.photo.info.detail) : undefined}
            />
          </li>
        ) : (
          <li key={item.key} className="min-w-0">
            <AchievementCard
              imageUrl={item.achievement.image_url}
              imageAlt={item.achievement.title}
              badge={t('Prestasi Siswa', 'Student Achievement')}
              title={item.achievement.title}
              event={item.achievement.description}
              participant={item.achievement.date_label ?? undefined}
            />
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
