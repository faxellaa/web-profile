'use client';

import { useCallback, useState } from 'react';
import FormModal from '@/app/components/FormModal';
import IncomingMailForm from '@/app/components/IncomingMailForm';
import { useLang } from '@/lib/i18n';

export default function SuratMasukPage() {
  const { t } = useLang();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const closeForm = useCallback(() => setIsFormOpen(false), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/35 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[32rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-32 sm:pt-40">
        <section className="relative overflow-hidden border border-white/70 bg-linear-to-br from-sky-200/60 via-white/50 to-violet-200/50 p-8 shadow-[0_30px_80px_-40px_rgba(56,189,248,0.6)] backdrop-blur-2xl dark:border-white/10 dark:from-sky-500/15 dark:via-white/[0.03] dark:to-indigo-500/15 sm:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-300/50 blur-3xl dark:bg-sky-500/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/40 blur-3xl dark:bg-indigo-500/20" />
          <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 border border-white/70 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800 backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-white">
                {t('Layanan Administrasi', 'Administration')}
              </span>
              <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                {t('Kirim Surat,', 'Send a Letter,')}
                <span className="block bg-linear-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent dark:from-sky-300 dark:to-violet-300">
                  {t('dengan Mudah', 'the Easy Way')}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
                {t(
                  'Kirim surat atau dokumen kepada SMP Muhammadiyah Kembaran secara online. Isi data pengirim dan informasi surat, lalu lampirkan berkas jika diperlukan.',
                  'Send a letter or document to SMP Muhammadiyah Kembaran online. Enter your contact and letter details, then attach a file if needed.',
                )}
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl border border-white/70 bg-white px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-950 shadow-sm transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-white dark:text-slate-950 dark:hover:bg-sky-100 sm:px-8 sm:text-sm"
              >
                {t('Isi Form Surat Masuk', 'Open Incoming Mail Form')}
              </button>
            </div>

            <ol className="grid gap-3">
              {[
                [t('01 · Isi Formulir', '01 · Fill the Form'), t('Lengkapi identitas pengirim dan informasi surat.', 'Enter the sender details and letter information.')],
                [t('02 · Verifikasi', '02 · Verification'), t('Administrasi sekolah menerima dan memeriksa surat.', 'The school office receives and reviews the letter.')],
                [t('03 · Tindak Lanjut', '03 · Follow-up'), t('Surat diteruskan kepada pihak yang dituju.', 'The letter is forwarded to the intended recipient.')],
              ].map(([title, description]) => (
                <li key={title} className="border border-white/70 bg-white/55 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white">{title}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <FormModal
        open={isFormOpen}
        title={t('Kirim Surat Masuk', 'Submit Incoming Mail')}
        onClose={closeForm}
      >
        <IncomingMailForm />
      </FormModal>
    </div>
  );
}
