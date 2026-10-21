'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Article = {
  id?: string;
  title: string;
  category?: string;
  description?: string;
  image_url?: string;
  date_label?: string;
};

const fallback: Article[] = [
  { title: 'Juara 1 Kejuaraan Tapak Suci Kabupaten Banyumas', category: 'Prestasi Siswa', description: 'Siswa SMP Muhammadiyah Kembaran menorehkan prestasi membanggakan di tingkat kabupaten.', date_label: 'Agustus 2026', image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=900' },
  { title: 'Pelatihan Guru dalam Pemanfaatan Kurikulum Digital', category: 'Kabar Pendidik', description: 'Peningkatan kompetensi tenaga pendidik untuk menghadirkan pembelajaran berkemajuan.', date_label: 'Juli 2026', image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900' },
  { title: 'Kemah Akbar Hizbul Wathan', category: 'Kegiatan Siswa', description: 'Kegiatan yang melatih kemandirian, ketangkasan, dan solidaritas peserta didik.', date_label: 'Juni 2026', image_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=900' },
];

export default function NewsGallery({ category }: { category?: string }) {
  const [items, setItems] = useState<Article[]>(fallback);
  const [selected, setSelected] = useState<Article | null>(null);

  useEffect(() => {
    supabase.from('articles').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data?.length) setItems(data);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selected]);

  const visible = category ? items.filter((item) => item.category?.toLowerCase().includes(category.toLowerCase())) : items;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(visible.length ? visible : fallback).map((item, index) => (
          <button key={item.id || `${item.title}-${index}`} type="button" onClick={() => setSelected(item)} className="group overflow-hidden rounded-3xl border border-white/80 bg-white/70 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
            <div className="h-52 overflow-hidden bg-slate-200 dark:bg-slate-800">
              <img src={item.image_url || fallback[index % fallback.length].image_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            </div>
            <div className="p-5">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700 dark:bg-white/10 dark:text-sky-300">{item.category || 'Informasi'}</span>
              <h2 className="mt-3 text-base font-bold text-blue-950 dark:text-white">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
              <p className="mt-4 text-xs font-semibold text-blue-600 dark:text-sky-400">{item.date_label || 'Terkini'} · Baca selengkapnya</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div role="dialog" aria-modal="true" aria-labelledby="news-dialog-title" onClick={() => setSelected(null)} className="fixed inset-0 z-100 overflow-y-auto bg-slate-950/95 p-4 backdrop-blur-md sm:p-8">
          <button type="button" aria-label="Tutup berita" onClick={() => setSelected(null)} className="fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><X className="h-5 w-5" /></button>
          <article onClick={(event) => event.stopPropagation()} className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center">
            <img src={selected.image_url || fallback[0].image_url} alt={selected.title} className="max-h-[55vh] w-full rounded-3xl object-cover" />
            <div className="py-7 text-white">
              <p className="text-sm font-bold uppercase tracking-wider text-sky-300">{selected.category || 'Informasi'} · {selected.date_label || 'Terkini'}</p>
              <h2 id="news-dialog-title" className="mt-3 text-3xl font-black sm:text-5xl">{selected.title}</h2>
              <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-300">{selected.description}</p>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
