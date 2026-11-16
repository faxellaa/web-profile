'use client';

import { useLang } from '@/lib/i18n';
import { AtSign, MapPin, Music2, Play, Users } from 'lucide-react';

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="52 42 88 66" className={className} aria-hidden="true">
      <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

const address = 'Jl. Masjid No.2, Kramat, Kembaran, Banyumas, Jawa Tengah 53182';
const mapUrl = 'https://maps.app.goo.gl/GrQX7pNsFh9SS2vh7';
const mapEmbedUrl = 'https://maps.google.com/maps?q=SMP%20Muhammadiyah%20Kembaran%20Banyumas&t=k&z=15&ie=UTF8&iwloc=&output=embed';
const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/smpmuhkembaran/', handle: '@smpmuhkembaran', Icon: AtSign, color: 'text-pink-600 dark:text-pink-300' },
  { label: 'Facebook', href: 'https://www.facebook.com/smpmuhkembaran/', handle: 'SMP Muhammadiyah Kembaran', Icon: Users, color: 'text-blue-700 dark:text-sky-300' },
  { label: 'YouTube', href: 'https://www.youtube.com/@smpmuhkembaran', handle: '@smpmuhkembaran', Icon: Play, color: 'text-red-600 dark:text-red-300' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@smpmuhkembaran', handle: '@smpmuhkembaran', Icon: Music2, color: 'text-slate-900 dark:text-white' },
];

const glass =
  'border border-white/70 bg-white/45 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-white/[0.04]';
const glassHover = 'hover:bg-white/70 dark:hover:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white';

const infos = [
  { label: 'Alamat', en: 'Address', value: address, href: mapUrl, Icon: MapPin, iconClassName: 'text-blue-700 dark:text-sky-300', external: true },
  { label: 'Email', value: 'smpmkembaran@gmail.com', href: 'mailto:smpmkembaran@gmail.com', Icon: GmailIcon, iconClassName: '', external: false },
  { label: 'WhatsApp', value: '+62 851-4777-7650', href: 'https://wa.me/6285147777650', Icon: WhatsAppIcon, iconClassName: 'text-emerald-600 dark:text-emerald-400', external: true },
];

export default function KontakPage() {
  const { t } = useLang();
  return (
    <div className="relative overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 pb-32 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[30rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl space-y-10 px-4 pt-32 sm:pt-40">
        <section aria-labelledby="social-heading">
          <h2 id="social-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('Media Sosial Resmi', 'Official Social Media')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {socials.map(({ label, href, handle, Icon, color }, i) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ animationDelay: `${i * 70}ms` }}
                className={`rise-in flex items-center gap-4 p-4 ${glass} ${glassHover}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${color}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-950 dark:text-white">{label}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{handle}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section aria-label={t('Informasi sekolah', 'School information')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {infos.map(({ label, en, value, href, Icon, iconClassName, external }, i) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`rise-in flex items-center gap-4 p-4 ${i === 0 ? 'sm:col-span-2' : ''} ${glass} ${glassHover}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconClassName}`} />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t(label, en ?? label)}</span>
                <span className={`mt-1 block text-sm leading-5 text-slate-900 dark:text-white ${label === 'Email' ? 'whitespace-nowrap' : 'break-words'}`}>{value}</span>
              </span>
            </a>
          ))}
        </section>

        <section aria-labelledby="map-heading" className={`rise-in flex flex-col p-3 sm:p-4 ${glass}`}>
          <div className="flex items-end justify-between gap-4 px-2 pb-4 pt-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('Kunjungi Kami', 'Visit Us')}</p>
              <h2 id="map-heading" className="mt-1 text-xl font-black text-slate-950 dark:text-white">{t('Lokasi Sekolah', 'School Location')}</h2>
            </div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-bold uppercase tracking-[0.15em] text-slate-700 underline-offset-4 hover:underline dark:text-slate-200">{t('Buka Maps', 'Open Maps')}</a>
          </div>
          <div className="h-80 overflow-hidden border border-white/70 bg-slate-200 dark:border-white/10 dark:bg-slate-800 sm:h-[28rem]">
            <iframe title={t('Peta lokasi SMP Muhammadiyah Kembaran', 'Map of SMP Muhammadiyah Kembaran')} src={mapEmbedUrl} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </section>
      </main>
    </div>
  );
}
