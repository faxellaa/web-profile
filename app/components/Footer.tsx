'use client';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLang();
  if (pathname.startsWith('/admin') || pathname === '/kontak') {
    return null;
  }
  const WA_ADMIN = "https://wa.me/6285147777650";
  const IG_URL = "https://www.instagram.com/smpmuhkembaran/";
  const FB_URL = "https://www.facebook.com/smpmuhkembaran/";
  const YOUTUBE_URL = "https://www.youtube.com/@smpmuhkembaran";
  const TIKTOK_URL = "https://www.tiktok.com/@smpmuhkembaran";
  const EMAIL = "smpmkembaran@gmail.com";

  return (
    <footer id="kontak" className="site-footer relative z-10 overflow-hidden border-t border-white/10 bg-gradient-to-b from-slate-900/95 via-blue-950/90 to-slate-950 px-4 pb-8 pt-16 text-slate-200 backdrop-blur-3xl">

      {/* Subtle Ambient Light Glow di Footer */}
      <div className="absolute top-0 left-1/4 w-96 h-40 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Grid 3 Kolom Modern */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">

          {/* Kolom 1: Identitas Sekolah & Logo (5 Kolom) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center">
                <img
                  src="/img/logosmp.png"
                  alt="Logo SMP Muhammadiyah Kembaran"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white leading-tight">
                  SMP Muhammadiyah Kembaran
                </h3>
                <p className="text-xs text-blue-300 mt-0.5 font-medium">
                  {t('Kecamatan Kembaran, Kabupaten Banyumas', 'Kembaran District, Banyumas Regency')}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              {t("Lembaga pendidikan tingkat menengah pertama di bawah naungan Majelis Dikdasmen Muhammadiyah yang berkomitmen mencetak generasi Qur'ani, cerdas, berkarakter, dan berdaya saing global.", "A junior high school under the Muhammadiyah Council for Primary and Secondary Education, committed to nurturing a Qur'anic, intelligent, high-character generation that competes globally.")}
            </p>

            {/* Media Sosial dengan Pill Glass Button */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href={IG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-200 transition-colors duration-200"
              >
                <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>

              <a
                href={FB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-200 transition-colors duration-200"
              >
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.6 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z"/>
                </svg>
                <span>Facebook</span>
              </a>

              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-200 transition-colors duration-200 hover:bg-white/15">
                <span className="text-red-400">▶</span>
                <span>YouTube</span>
              </a>

              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-200 transition-colors duration-200 hover:bg-white/15">
                <span className="text-cyan-300">♪</span>
                <span>TikTok</span>
              </a>
            </div>
          </div>

          {/* Kolom 2: Kontak & Layanan Cepat (3 Kolom) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
              {t('Layanan & Kontak', 'Services & Contact')}
            </h4>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="text-blue-400 mt-0.5 text-sm">📍</span>
                <span className="leading-relaxed">
                  {t('Jl. Masjid No.2, Kramat, Kembaran, Banyumas, Jawa Tengah 53182', 'Jl. Masjid No.2, Kramat, Kembaran, Banyumas, Central Java 53182')}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-sm text-sky-400">@</span>
                <a href={`mailto:${EMAIL}`} className="font-semibold text-sky-300 hover:underline">{EMAIL}</a>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-emerald-400 mt-0.5 text-sm">💬</span>
                <div>
                  <span className="block text-slate-400">{t('WhatsApp Pelayanan:', 'WhatsApp Support:')}</span>
                  <a href={WA_ADMIN} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-semibold hover:underline">
                    +62 851-4777-7650
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Kolom 3: Peta Lokasi dengan Frame Kaca (4 Kolom) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                {t('Peta Lokasi', 'Location Map')}
              </h4>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/15 shadow-inner bg-slate-800/60 h-44 w-full relative">
              <iframe
                title="Peta Lokasi SMP Muhammadiyah Kembaran"
                src="https://maps.google.com/maps?q=SMP%20Muhammadiyah%20Kembaran%20Banyumas&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 grayscale-[20%] hover:grayscale-0 transition-all duration-300"
                loading="lazy"
              />
            </div>
          </div>

        </div>

        {/* Baris Bawah: Copyright & Status */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} SMP Muhammadiyah Kembaran. {t('Hak Cipta Dilindungi.', 'All rights reserved.')}</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="text-blue-400 font-medium">Banyumas, Jateng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
