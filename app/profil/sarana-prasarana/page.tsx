'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { DEFAULT_FACILITIES, mergeDefaultFacilities } from '@/lib/school-content';

type Facility = {
  id: string;
  name: string;
  description: string;
  image_url?: string | null;
};

export default function FacilitiesPage() {
  const { t } = useLang();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFacilities() {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, description, image_url');

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load school facilities:', error);
        setFacilities(DEFAULT_FACILITIES);
        setLoadError(true);
      } else {
        setFacilities(mergeDefaultFacilities(data ?? []));
      }
      setLoading(false);
    }

    void loadFacilities();
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
            {t('Lingkungan Sekolah', 'School Environment')}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            {t('Sarana & Prasarana', 'Facilities')}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            {t(
              'Fasilitas dan lingkungan belajar yang mendukung kegiatan pendidikan di SMP Muhammadiyah Kembaran.',
              'Facilities and learning spaces that support education at SMP Muhammadiyah Kembaran.',
            )}
          </p>
        </header>

        {loading ? (
          <p role="status" className="mt-10 border border-white/70 bg-white/45 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            {t('Memuat sarana dan prasarana...', 'Loading facilities...')}
          </p>
        ) : (
          <>
            {loadError && (
              <p role="status" className="mt-10 border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                {t('Data dari Supabase belum dapat dimuat. Sementara menampilkan fasilitas sekolah.', 'Supabase data could not be loaded. Showing the school facilities for now.')}
              </p>
            )}
            {facilities.length === 0 ? (
              <p className="mt-10 border border-white/70 bg-white/45 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                {t('Informasi sarana dan prasarana belum tersedia.', 'Facility information is not available yet.')}
              </p>
            ) : (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {facilities.map((facility) => (
                  <article
                    key={facility.id}
                    className="group overflow-hidden border border-white/70 bg-white/45 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-2xl transition-colors duration-300 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.09]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-900">
                      {facility.image_url ? (
                        <img src={facility.image_url} alt={facility.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-linear-to-br from-sky-100 via-white to-violet-100 text-sky-700 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 dark:text-sky-300">
                          <Building2 aria-hidden="true" className="h-12 w-12" strokeWidth={1.4} />
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6">
                      <h2 className="text-lg font-black text-slate-950 dark:text-white">{facility.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{facility.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
