'use client';

import AdminNavbar from '../components/navbar';
import { useLang } from '@/lib/i18n';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/16k0WgG2xifOoIEKgJLj3FGsXxT9m7HI5BOh6Z2TTxJA/edit';

export default function AdminSuratMasukPage() {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="border-b border-slate-200/70 pb-5 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Layanan Publik', 'Public Services')}</p>
          <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Surat Masuk', 'Incoming Mail')}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Kelola dan tinjau pengajuan surat masuk melalui spreadsheet sekolah.', 'Manage and review incoming mail requests in the school spreadsheet.')}</p>
        </header>

        <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-lg font-black text-blue-950 dark:text-white">{t('Data Surat Masuk', 'Incoming Mail Records')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t('Data pengajuan surat disimpan di spreadsheet terpisah dari data pendaftar SPMB.', 'Incoming mail requests are stored separately from SPMB applicant records.')}</p>
          </div>
          <a
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800"
          >
            {t('Buka Spreadsheet Surat Masuk', 'Open Incoming Mail Spreadsheet')}
          </a>
        </section>
      </div>
    </div>
  );
}
