import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import PhotoGallery from '@/app/components/PhotoGallery';

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

function getPhotos() {
  return readdirSync(join(process.cwd(), 'public', 'img', 'bahan'))
    .filter((file) => IMAGE_EXT.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => `/img/bahan/${encodeURIComponent(file)}`);
}

export default function PhotoPage() {
  const photos = getPhotos();

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/35 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[32rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-32 pt-32 sm:pt-40">
        <header className="mb-10 max-w-3xl border-b border-slate-300/60 pb-7 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
            Dokumentasi SMP Muhammadiyah Kembaran
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Galeri Foto
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            Kumpulan foto kegiatan dan suasana belajar di SMP Muhammadiyah Kembaran.
          </p>
        </header>
        <PhotoGallery photos={photos} />
      </main>
    </div>
  );
}
