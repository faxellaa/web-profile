'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 12;

type GalleryPhoto = { src: string; title?: string };

export default function PhotoGallery({ photos }: { photos: string[] }) {
  const { t } = useLang();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [managedPhotos, setManagedPhotos] = useState<GalleryPhoto[]>([]);
  const [managedPhotosLoaded, setManagedPhotosLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from('school_gallery_items')
      .select('media_url,title')
      .eq('media_type', 'photo')
      .order('sort_order')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load managed gallery photos:', error);
          if (active) setLoadError(true);
        } else if (active) {
          setManagedPhotos((data || []).map((item) => ({ src: item.media_url, title: item.title })));
          setManagedPhotosLoaded(true);
        }
      });
    return () => { active = false; };
  }, []);

  const allPhotos: GalleryPhoto[] = managedPhotosLoaded ? managedPhotos : photos.map((src) => ({ src }));

  if (allPhotos.length === 0) {
    return (
      <p className="border border-white/70 bg-white/50 p-10 text-center text-slate-600 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        {t('Belum ada foto untuk ditampilkan.', 'There are no photos to display yet.')}
      </p>
    );
  }

  return (
    <>
      {loadError && (
        <p role="status" className="mb-5 rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
          {t('Foto tambahan belum dapat dimuat. Foto bawaan tetap ditampilkan.', 'Additional photos could not be loaded. Existing photos are still displayed.')}
        </p>
      )}
      <p className="mx-auto mb-8 w-fit border border-white/70 bg-white/45 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
        {allPhotos.length} {t('Foto Kegiatan Sekolah', 'School Photos')}
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allPhotos.slice(0, visibleCount).map((photo, index) => (
          <li key={photo.src}>
            <figure className="group overflow-hidden border border-white/70 bg-white/45 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
              <div className="aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-900">
                <img
                  src={photo.src}
                  alt={`${t('Dokumentasi sekolah', 'School documentation')} ${index + 1}`}
                  loading={index < 6 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <figcaption className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {photo.title || t('Dokumentasi SMP Muhammadiyah Kembaran', 'SMP Muhammadiyah Kembaran documentation')}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {visibleCount < allPhotos.length && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="border border-white/70 bg-white/55 px-8 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-900 backdrop-blur-2xl transition-colors hover:bg-white/80 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]"
          >
            {t('Muat Foto Lainnya', 'Load More Photos')}
          </button>
        </div>
      )}
    </>
  );
}
