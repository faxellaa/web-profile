'use client';

import { useCallback, useState } from 'react';
import FormModal from '@/app/components/FormModal';
import SpmbRegistrationForm from '@/app/components/SpmbRegistrationForm';
import { useLang } from '@/lib/i18n';
import { WA_ADMIN_URL } from '@/lib/site-links';

export default function SpmbOnlinePage() {
  const { t } = useLang();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const closeForm = useCallback(() => setIsFormOpen(false), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[32rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-32 pt-32 sm:pt-40">
        <section className="relative overflow-hidden border border-white/70 bg-linear-to-br from-sky-200/60 via-white/50 to-violet-200/50 p-8 shadow-[0_30px_80px_-40px_rgba(56,189,248,0.6)] backdrop-blur-2xl dark:border-white/10 dark:from-sky-500/15 dark:via-white/[0.03] dark:to-indigo-500/15 sm:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-300/50 blur-3xl dark:bg-sky-500/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/40 blur-3xl dark:bg-indigo-500/20" />
          <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 border border-white/70 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800 backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-white">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('Pendaftaran Dibuka', 'Registration Open')}
              </span>
              <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                {t('Daftar Sekarang,', 'Enroll Now,')}
                <span className="block bg-linear-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent dark:from-sky-300 dark:to-violet-300">
                  {t('Raih Masa Depan Cerah', 'Build a Bright Future')}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
                {t(
                  'Bergabunglah bersama SMP Muhammadiyah Kembaran. Sistem Penerimaan Murid Baru (SPMB) bisa diisi secara online, cepat, dan mudah dari mana saja.',
                  'Join SMP Muhammadiyah Kembaran. New student admission (SPMB) is online, quick, and easy to complete from anywhere.',
                )}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-sky-700 dark:bg-white dark:text-slate-950 dark:hover:bg-sky-200 sm:px-8 sm:text-sm"
                >
                  {t('Isi Formulir SPMB', 'Start Admission Form')}
                </button>
                <a
                  href={WA_ADMIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/70 bg-white/50 px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-900 backdrop-blur-2xl transition-colors hover:bg-white/80 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/15 sm:text-sm"
                >
                  {t('Tanya Panitia', 'Ask the Committee')}
                </a>
              </div>
            </div>

            <ol className="grid gap-3">
              {[
                [t('01 · Isi Formulir', '01 · Fill the Form'), t('Lengkapi data calon siswa secara online.', 'Complete the applicant’s data online.')],
                [t('02 · Verifikasi', '02 · Verification'), t('Panitia menghubungi dan memverifikasi data.', 'The committee contacts you to verify the details.')],
                [t('03 · Resmi Diterima', '03 · Accepted'), t('Selesaikan administrasi dan mulai belajar.', 'Finish administration and start learning.')],
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
        title={t('Formulir Pendaftaran SPMB', 'SPMB Registration Form')}
        onClose={closeForm}
      >
          <SpmbRegistrationForm />
      </FormModal>
    </div>
  );
}
