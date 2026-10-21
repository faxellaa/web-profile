'use client';

import { useLang } from '@/lib/i18n';
import { AtSign, Mail, MapPin, Music2, Phone, Play, Users } from 'lucide-react';

const address = 'Jl. Masjid No.2, Kramat, Kembaran, Banyumas, Jawa Tengah 53182';
const mapUrl = 'https://maps.app.goo.gl/GrQX7pNsFh9SS2vh7';
const mapEmbedUrl = 'https://maps.google.com/maps?q=SMP%20Muhammadiyah%20Kembaran%20Banyumas&t=&z=15&ie=UTF8&iwloc=&output=embed';
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
  { label: 'Alamat', en: 'Address', value: address, href: mapUrl, Icon: MapPin, external: true },
  { label: 'Email', value: 'smpmkembaran@gmail.com', href: 'mailto:smpmkembaran@gmail.com', Icon: Mail, external: false },
  { label: 'WhatsApp', value: '+62 851-4777-7650', href: 'https://wa.me/6285147777650', Icon: Phone, external: true },
];

export default function KontakPage() {
  const { t } = useLang();
  return (
    <div className="relative overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 pb-32 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[30rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <main className="relative mx-auto grid max-w-6xl gap-8 px-4 pt-32 sm:pt-40 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          <section aria-label={t('Informasi sekolah', 'School information')} className="space-y-4">
            {infos.map(({ label, en, value, href, Icon, external }, i) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{ animationDelay: `${i * 70}ms` }}
                className={`rise-in flex items-start gap-5 p-5 sm:p-6 ${glass} ${glassHover}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/70 bg-white/60 text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t(label, en ?? label)}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-900 dark:text-white sm:text-base">{value}</span>
                </span>
              </a>
            ))}
          </section>

          <section aria-labelledby="social-heading">
            <h2 id="social-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('Media Sosial Resmi', 'Official Social Media')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>

        <section aria-labelledby="map-heading" className={`rise-in flex flex-col p-3 sm:p-4 ${glass}`}>
          <div className="flex items-end justify-between gap-4 px-2 pb-4 pt-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('Kunjungi Kami', 'Visit Us')}</p>
              <h2 id="map-heading" className="mt-1 text-xl font-black text-slate-950 dark:text-white">{t('Lokasi Sekolah', 'School Location')}</h2>
            </div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-bold uppercase tracking-[0.15em] text-slate-700 underline-offset-4 hover:underline dark:text-slate-200">{t('Buka Maps', 'Open Maps')}</a>
          </div>
          <div className="min-h-80 flex-1 overflow-hidden border border-white/70 bg-slate-200 dark:border-white/10 dark:bg-slate-800">
            <iframe title={t('Peta lokasi SMP Muhammadiyah Kembaran', 'Map of SMP Muhammadiyah Kembaran')} src={mapEmbedUrl} className="h-full min-h-80 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </section>
      </main>
    </div>
  );
}
