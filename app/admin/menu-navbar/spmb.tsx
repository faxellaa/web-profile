'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
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
  guardian_whatsapp: string | null;
  snsps_document_path: string | null;
  graduation_proof_path: string | null;
  status: 'Baru' | 'Diverifikasi' | 'Diterima';
  submitted_at: string;
};

const PAGE_SIZE = 20;
const statuses = ['Baru', 'Diverifikasi', 'Diterima'] as const;
type StatusFilter = 'Semua' | Application['status'];

const statusGuidance: Record<Application['status'], { en: string; id: string }> = {
  Baru: {
    id: 'Pendaftaran masuk dan menunggu pemeriksaan data serta berkas.',
    en: 'Application received and waiting for details and documents to be reviewed.',
  },
  Diverifikasi: {
    id: 'Data dan berkas sudah diperiksa; panitia dapat menghubungi jika ada tindak lanjut.',
    en: 'Details and documents have been reviewed; the committee can contact the family if follow-up is needed.',
  },
  Diterima: {
    id: 'Pendaftar diterima; kirim kabar dan informasi langkah berikutnya.',
    en: 'Applicant accepted; send the result and information about next steps.',
  },
};

export default function AdminSpmbPage() {
  const router = useRouter();
  const { t } = useLang();
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [narrowCards, setNarrowCards] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [busyDocumentPath, setBusyDocumentPath] = useState('');

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
        .select('id,full_name,nickname,school_origin,birth_place,birth_date,nik,guardian_whatsapp,snsps_document_path,graduation_proof_path,status,submitted_at', { count: 'exact' })
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

  const deleteLegacyApplication = async (application: Application) => {
    if (application.guardian_whatsapp !== null) return;
    if (!window.confirm(t(
      `Hapus permanen data pendaftar ${application.full_name} yang belum memiliki nomor WhatsApp? Berkas yang diunggah juga akan dihapus.`,
      `Permanently delete ${application.full_name}'s application without a WhatsApp number? Uploaded documents will also be deleted.`,
    ))) return;

    setBusyId(application.id);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('spmb_applications')
        .delete()
        .eq('id', application.id)
        .is('guardian_whatsapp', null)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Failed to delete legacy SPMB application:', error);
        setErrorMessage(t('Data pendaftar belum berhasil dihapus.', 'The application could not be deleted.'));
        return;
      }
      if (!data) {
        setErrorMessage(t('Data tidak ditemukan atau nomor WhatsApp sudah diperbarui. Muat ulang daftar lalu coba lagi.', 'The application was not found or its WhatsApp number has been updated. Reload the list and try again.'));
        return;
      }

      setApplications((current) => current.filter((item) => item.id !== application.id));
      setTotalCount((current) => Math.max(0, current - 1));
      if (applications.length === 1 && page > 0) setPage((current) => current - 1);

      const filePaths = [application.snsps_document_path, application.graduation_proof_path]
        .filter((path): path is string => Boolean(path));
      if (filePaths.length) {
        const { error: storageError } = await supabase.storage.from('spmb-documents').remove(filePaths);
        if (storageError) {
          console.error('Failed to remove deleted SPMB application documents:', storageError);
          setErrorMessage(t(
            `Data pendaftar sudah dihapus, tetapi berkas belum terhapus. Hubungi administrator dan sebutkan ID ${application.id}.`,
            `The application was deleted, but its files could not be removed. Contact an administrator and provide ID ${application.id}.`,
          ));
        }
      }
    } catch (error) {
      console.error('Unexpected error while deleting a legacy SPMB application:', error);
      setErrorMessage(t('Terjadi kesalahan saat menghapus data pendaftar.', 'An error occurred while deleting the application.'));
    } finally {
      setBusyId('');
    }
  };

  const downloadDocument = async (path: string) => {
    setBusyDocumentPath(path);
    setErrorMessage('');
    try {
      const { data, error } = await supabase.storage.from('spmb-documents').download(path);
      if (error) {
        console.error('Failed to download private SPMB document:', error);
        setErrorMessage(t('Berkas gagal diunduh. Pastikan akun Anda memiliki akses admin, lalu coba lagi.', 'The document could not be downloaded. Confirm that your account has admin access, then try again.'));
        return;
      }

      const objectUrl = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = path.split('/').pop() || 'dokumen-spmb';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error('Unexpected error while downloading a private SPMB document:', error);
      setErrorMessage(t('Terjadi kesalahan saat mengunduh berkas.', 'An error occurred while downloading the document.'));
    } finally {
      setBusyDocumentPath('');
    }
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
            {t('Periksa data dan berkas, ubah status proses, lalu gunakan tombol WhatsApp untuk menyiapkan kabar kepada orang tua/wali.', 'Review applicant details and documents, update the status, then use WhatsApp to prepare an update for the parent/guardian.')}
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t('Baru: menunggu pemeriksaan. Diverifikasi: data dan berkas sudah dicek. Diterima: lolos seleksi. Pesan WhatsApp perlu dikirim manual oleh admin.', 'New: awaiting review. Verified: details and documents checked. Accepted: passed selection. WhatsApp messages must be sent manually by an admin.')}
          </p>
          <button
            type="button"
            aria-pressed={narrowCards}
            onClick={() => setNarrowCards((current) => !current)}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10"
          >
            {narrowCards ? t('Perlebar tampilan', 'Widen layout') : t('Perkecil tampilan', 'Narrow layout')}
          </button>
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
            {applications.map((application) => {
              const statusMessage = application.status === 'Baru'
                ? t(
                  `Assalamu’alaikum, kami dari SMP Muhammadiyah Kembaran telah menerima pendaftaran SPMB atas nama ${application.full_name}. Pendaftaran sedang menunggu pemeriksaan data dan berkas. Terima kasih.`,
                  `Hello, SMP Muhammadiyah Kembaran has received the SPMB application for ${application.full_name}. It is waiting for the details and documents to be reviewed. Thank you.`,
                )
                : application.status === 'Diverifikasi'
                  ? t(
                    `Assalamu’alaikum, data dan berkas pendaftaran SPMB atas nama ${application.full_name} sudah diverifikasi. Panitia akan menghubungi kembali jika ada informasi selanjutnya.`,
                    `Hello, the SPMB details and documents for ${application.full_name} have been verified. The committee will contact you if there is an update.`,
                  )
                  : t(
                    `Assalamu’alaikum, selamat! Pendaftaran SPMB atas nama ${application.full_name} dinyatakan diterima di SMP Muhammadiyah Kembaran. Panitia akan menghubungi terkait langkah selanjutnya.`,
                    `Hello, congratulations! ${application.full_name} has been accepted to SMP Muhammadiyah Kembaran. The committee will contact you about the next steps.`,
                  );
              const whatsappUrl = application.guardian_whatsapp
                ? `https://wa.me/${application.guardian_whatsapp}?text=${encodeURIComponent(statusMessage)}`
                : null;
              const guidance = statusGuidance[application.status];

              return (
              <article key={application.id} className={`mx-auto w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6 ${narrowCards ? 'max-w-3xl' : 'max-w-none'}`}>
                <div className="grid gap-4">
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
                  <label className="grid w-full gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t('Status pendaftaran', 'Application status')}
                    <select
                      value={application.status}
                      disabled={busyId === application.id}
                      onChange={(event) => void updateStatus(application, event.target.value as Application['status'])}
                      className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {t(status, status === 'Baru' ? 'New' : status === 'Diverifikasi' ? 'Verified' : 'Accepted')}
                        </option>
                      ))}
                    </select>
                    <span className="font-normal leading-5">{t(guidance.id, guidance.en)}</span>
                  </label>
                </div>

                <details className="mt-5 border-t border-slate-200/80 pt-4 dark:border-white/10">
                  <summary className="w-fit cursor-pointer rounded-lg py-1 text-sm font-bold text-blue-700 outline-none hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-sky-300 dark:hover:text-sky-200">
                    {t('Lihat data dan berkas', 'View details and documents')}
                  </summary>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="min-w-0 border-b border-slate-200/70 pb-3 dark:border-white/10">
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Asal sekolah', 'Previous school')}</dt>
                      <dd className="mt-1 break-words font-medium">{application.school_origin || '—'}</dd>
                    </div>
                    <div className="min-w-0 border-b border-slate-200/70 pb-3 dark:border-white/10">
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('WhatsApp orang tua/wali', 'Parent/guardian WhatsApp')}</dt>
                      <dd className="mt-1 break-words font-medium">{application.guardian_whatsapp ? `+${application.guardian_whatsapp}` : '—'}</dd>
                    </div>
                    <div className="border-b border-slate-200/70 pb-3 dark:border-white/10">
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Tempat, tanggal lahir', 'Place and date of birth')}</dt>
                      <dd className="mt-1 break-words font-medium">{application.birth_place}, {new Date(`${application.birth_date}T00:00:00`).toLocaleDateString('id-ID')}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">NIK</dt>
                      <dd className="mt-1 font-mono font-medium">{application.nik}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 grid gap-3">
                    {([
                      { path: application.snsps_document_path, label: t('Foto/Scan SNSP', 'SNSP photo/scan') },
                      { path: application.graduation_proof_path, label: t('Bukti tanda kelulusan', 'Graduation certificate') },
                    ] satisfies { path: string | null; label: string }[]).map(({ path, label }) => (
                      <div key={label} className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0 text-sm font-semibold">{label}</span>
                        {!path ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{t('Belum ada berkas', 'No file attached')}</span>
                        ) : (
                          <button
                            type="button"
                            disabled={busyDocumentPath === path}
                            onClick={() => void downloadDocument(path)}
                            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                          >
                            <Download aria-hidden="true" className="h-4 w-4" />
                            {busyDocumentPath === path ? t('Mengunduh…', 'Downloading…') : t('Unduh berkas', 'Download file')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </details>

                <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-white/10">
                  {whatsappUrl ? (
                    <div className="grid gap-3">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('WhatsApp orang tua/wali:', 'Parent/guardian WhatsApp:')} <span className="font-semibold">+{application.guardian_whatsapp}</span>
                      </p>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
                      >
                        {t('Siapkan kabar via WhatsApp', 'Prepare WhatsApp update')}
                      </a>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('Nomor WhatsApp belum tersedia. Pendaftar ini mengirim formulir sebelum kolom WhatsApp ditambahkan.', 'No WhatsApp number is available. This application was submitted before the WhatsApp field was added.')}
                      </p>
                      <button
                        type="button"
                        disabled={busyId === application.id}
                        onClick={() => void deleteLegacyApplication(application)}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === application.id ? t('Menghapus…', 'Deleting…') : t('Hapus pendaftar lama', 'Delete legacy applicant')}
                      </button>
                    </div>
                  )}
                </div>
              </article>
              );
            })}
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
