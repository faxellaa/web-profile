'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import AdminNavbar from '../components/navbar';

type Application = {
  id: string;
  full_name: string;
  nickname: string;
  school_origin: string;
  birth_place: string;
  birth_date: string;
  nik: string;
  snsps_document_path: string | null;
  graduation_proof_path: string | null;
  status: 'Baru' | 'Diverifikasi' | 'Diterima';
  submitted_at: string;
};

const PAGE_SIZE = 20;
const statuses = ['Baru', 'Diverifikasi', 'Diterima'] as const;
type StatusFilter = 'Semua' | Application['status'];

export default function AdminSpmbPage() {
  const router = useRouter();
  const { t } = useLang();
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const loadApplications = async () => {
      setLoading(true);
      setErrorMessage('');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to read SPMB admin session:', sessionError);
        if (active) {
          setErrorMessage(t('Sesi admin tidak dapat diverifikasi.', 'The admin session could not be verified.'));
          setLoading(false);
        }
        return;
      }
      if (!sessionData.session) {
        router.replace('/admin/login');
        return;
      }

      let query = supabase
        .from('spmb_applications')
        .select('id,full_name,nickname,school_origin,birth_place,birth_date,nik,snsps_document_path,graduation_proof_path,status,submitted_at', { count: 'exact' })
        .order('submitted_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (statusFilter !== 'Semua') query = query.eq('status', statusFilter);
      if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`);

      const { data, count, error } = await query;
      if (error) {
        console.error('Failed to load SPMB applications:', error);
        if (active) setErrorMessage(t('Data pendaftar belum dapat dimuat.', 'Applications could not be loaded.'));
      } else if (active) {
        setApplications(data || []);
        setTotalCount(count || 0);
      }
      if (active) setLoading(false);
    };

    void loadApplications();
    return () => { active = false; };
  }, [page, router, search, statusFilter, t]);

  const updateStatus = async (application: Application, status: Application['status']) => {
    setBusyId(application.id);
    setErrorMessage('');
    const { error } = await supabase
      .from('spmb_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', application.id);
    if (error) {
      console.error('Failed to update SPMB application status:', error);
      setErrorMessage(t('Status pendaftar belum berhasil diperbarui.', 'The application status could not be updated.'));
    } else {
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status } : item));
    }
    setBusyId('');
  };

  const createDocumentLink = async (path: string) => {
    setErrorMessage('');
    const { data, error } = await supabase.storage.from('spmb-documents').createSignedUrl(path, 60);
    if (error) {
      console.error('Failed to create private SPMB document link:', error);
      setErrorMessage(t('Berkas tidak dapat dibuka. Pastikan akun Anda memiliki akses admin.', 'The document could not be opened. Confirm that your account has admin access.'));
      return;
    }
    setSignedUrls((current) => ({ ...current, [path]: data.signedUrl }));
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="border-b border-slate-200/70 pb-5 dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">
            {t('Layanan Publik', 'Public Services')}
          </p>
          <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">
            {t('Pendaftar SPMB', 'SPMB Applications')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t('Tinjau data pendaftar, buka berkas melalui tautan privat 60 detik, lalu perbarui status seleksi.', 'Review applications, open documents through private 60-second links, and update admission status.')}
          </p>
        </header>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {errorMessage}
          </p>
        )}

        <section className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end sm:p-5">
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Cari nama pendaftar', 'Search applicant name')}
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              placeholder={t('Ketik nama lengkap…', 'Type a full name…')}
              className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Status', 'Status')}
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPage(0); }}
              className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white"
            >
              <option value="Semua">{t('Semua status', 'All statuses')}</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalCount} {t('pendaftar', 'applications')}
          </p>
        </section>

        {loading ? (
          <div className="admin-loading" role="status">
            <span>{t('Memuat data pendaftar…', 'Loading applications…')}</span>
          </div>
        ) : applications.length === 0 ? (
          <p className="rounded-2xl border border-slate-200/80 bg-white/70 p-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            {t('Belum ada data pendaftar yang sesuai.', 'No matching applications were found.')}
          </p>
        ) : (
          <section className="grid gap-4">
            {applications.map((application) => (
              <article key={application.id} className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {new Date(application.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <h2 className="mt-1 break-words text-lg font-black text-slate-950 dark:text-white">
                      {application.full_name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t('Nama panggilan:', 'Nickname:')} {application.nickname}
                    </p>
                  </div>
                  <label className="grid w-full gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 sm:w-52">
                    {t('Status pendaftaran', 'Application status')}
                    <select
                      value={application.status}
                      disabled={busyId === application.id}
                      onChange={(event) => void updateStatus(application, event.target.value as Application['status'])}
                      className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                    >
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                </div>

                <details className="mt-5 border-t border-slate-200/80 pt-4 dark:border-white/10">
                  <summary className="w-fit cursor-pointer rounded-lg py-1 text-sm font-bold text-blue-700 outline-none hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-sky-300 dark:hover:text-sky-200">
                    {t('Lihat data dan berkas', 'View details and documents')}
                  </summary>
                  <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Asal sekolah', 'Previous school')}</dt>
                      <dd className="mt-1 break-words font-medium">{application.school_origin || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Tempat, tanggal lahir', 'Place and date of birth')}</dt>
                      <dd className="mt-1 break-words font-medium">{application.birth_place}, {new Date(`${application.birth_date}T00:00:00`).toLocaleDateString('id-ID')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">NIK</dt>
                      <dd className="mt-1 font-mono font-medium">{application.nik}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {([
                      { path: application.snsps_document_path, label: t('Foto/Scan SNSP', 'SNSP photo/scan') },
                      { path: application.graduation_proof_path, label: t('Bukti tanda kelulusan', 'Graduation certificate') },
                    ] satisfies { path: string | null; label: string }[]).map(({ path, label }) => (
                      <div key={label} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/40">
                        <span className="min-w-0 text-sm font-semibold">{label}</span>
                        {!path ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{t('Tidak dilampirkan', 'Not attached')}</span>
                        ) : signedUrls[path] ? (
                          <a href={signedUrls[path]} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-700 underline underline-offset-2 dark:text-sky-300">
                            {t('Buka berkas', 'Open document')}
                          </a>
                        ) : (
                          <button type="button" onClick={() => void createDocumentLink(path)} className="min-h-10 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20">
                            {t('Buat tautan 60 detik', 'Create 60-second link')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            ))}
          </section>
        )}

        {!loading && totalPages > 1 && (
          <nav aria-label={t('Halaman pendaftar', 'Application pages')} className="flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((value) => value - 1)}
              className="min-h-11 rounded-xl border border-slate-300/80 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
            >
              {t('Sebelumnya', 'Previous')}
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">{page + 1} / {totalPages}</span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="min-h-11 rounded-xl border border-slate-300/80 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
            >
              {t('Berikutnya', 'Next')}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
