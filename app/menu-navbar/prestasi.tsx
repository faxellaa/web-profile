import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import PrestasiGallery from '../components/PrestasiGallery';
import { PRESTASI_INFO } from '@/lib/prestasi-data';

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

function getPhotos() {
  try {
    return readdirSync(join(process.cwd(), 'public', 'img', 'prestasi'))
      .filter((file) => IMAGE_EXT.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file) => ({ src: `/img/prestasi/${encodeURIComponent(file)}`, info: PRESTASI_INFO[file] ?? null }));
  } catch {
    return [];
  }
}

export default function PrestasiPage() {
  const photos = getPhotos();

  return (
    <div className="relative overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[32rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute left-1/3 top-[80rem] h-96 w-96 rounded-full bg-teal-200/40 blur-3xl dark:bg-blue-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-32 pt-32 sm:pt-40">
        <PrestasiGallery photos={photos} />
      </main>
    </div>
  );
}
