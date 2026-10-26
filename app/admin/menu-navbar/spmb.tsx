'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Download } from 'lucide-react';
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [busyDocumentPath, setBusyDocumentPath] = useState('');
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(() => new Set());

  const toggleApplicationDetails = (applicationId: string) => {
    setExpandedApplications((current) => {
      const next = new Set(current);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  };

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
        </header>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {errorMessage}
          </p>
        )}

        <section className="grid gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end sm:p-4">
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Cari nama pendaftar', 'Search applicant name')}
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              placeholder={t('Ketik nama lengkap…', 'Type a full name…')}
              className="min-h-10 rounded-lg border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Status', 'Status')}
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPage(0); }}
              className="min-h-10 rounded-lg border border-slate-300/80 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white"
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
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
                <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 dark:bg-white/[0.035] dark:text-slate-400">
                  <tr>
                    <th scope="col" className="w-48 px-4 py-3">{t('Tanggal daftar', 'Submitted')}</th>
                    <th scope="col" className="px-4 py-3">{t('Calon siswa', 'Applicant')}</th>
                    <th scope="col" className="w-[22rem] px-4 py-3 text-right">{t('Status pendaftaran', 'Application status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
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
                    const isExpanded = expandedApplications.has(application.id);
                    const detailsId = `application-details-${application.id}`;

                    return (
                      <Fragment key={application.id}>
                        <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.025]">
                          <td className="px-4 py-3 align-middle text-xs font-medium text-slate-500 dark:text-slate-400">
                            {new Date(application.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="min-w-0 px-4 py-3 align-middle">
                            <p className="break-words text-sm font-bold text-slate-950 dark:text-white">{application.full_name}</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {t('Nama panggilan:', 'Nickname:')} {application.nickname}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <label className="sr-only" htmlFor={`application-status-${application.id}`}>
                                {t(`Status pendaftaran ${application.full_name}`, `Application status for ${application.full_name}`)}
                              </label>
                              <select
                                id={`application-status-${application.id}`}
                                value={application.status}
                                disabled={busyId === application.id}
                                onChange={(event) => void updateStatus(application, event.target.value as Application['status'])}
                                className="min-h-9 w-full max-w-56 rounded-lg border border-slate-300/80 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                              >
                                {statuses.map((status) => (
                                  <option key={status} value={status}>
                                    {t(status, status === 'Baru' ? 'New' : status === 'Diverifikasi' ? 'Verified' : 'Accepted')}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-controls={detailsId}
                                aria-label={t('Lihat selengkapnya', 'See more')}
                                title={t('Lihat selengkapnya', 'See more')}
                                onClick={() => toggleApplicationDetails(application.id)}
                                className="group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 outline-none transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-sky-400/40 dark:hover:bg-sky-400/10 dark:hover:text-sky-200"
                              >
                                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-900">
                                  {t('Lihat selengkapnya', 'See more')}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr id={detailsId} className="bg-slate-50/60 dark:bg-white/[0.02]">
                            <td colSpan={3} className="px-4 pb-4 pt-3">
                              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/30 sm:p-4">
                                <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                  <div className="min-w-0 rounded-lg bg-slate-50/80 p-3 dark:bg-white/[0.035]">
                                    <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Asal sekolah', 'Previous school')}</dt>
                                    <dd className="mt-1 break-words text-sm font-medium">{application.school_origin || '—'}</dd>
                                  </div>
                                  <div className="min-w-0 rounded-lg bg-slate-50/80 p-3 dark:bg-white/[0.035]">
                                    <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('WhatsApp orang tua/wali', 'Parent/guardian WhatsApp')}</dt>
                                    <dd className="mt-1 break-words text-sm font-medium">{application.guardian_whatsapp ? `+${application.guardian_whatsapp}` : '—'}</dd>
                                  </div>
                                  <div className="min-w-0 rounded-lg bg-slate-50/80 p-3 dark:bg-white/[0.035]">
                                    <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Tempat, tanggal lahir', 'Place and date of birth')}</dt>
                                    <dd className="mt-1 break-words text-sm font-medium">{application.birth_place}, {new Date(`${application.birth_date}T00:00:00`).toLocaleDateString('id-ID')}</dd>
                                  </div>
                                  <div className="min-w-0 rounded-lg bg-slate-50/80 p-3 dark:bg-white/[0.035]">
                                    <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">NIK</dt>
                                    <dd className="mt-1 break-words font-mono text-sm font-medium">{application.nik}</dd>
                                  </div>
                                </dl>

                                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{t(guidance.id, guidance.en)}</p>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {([
                                    { path: application.snsps_document_path, label: t('Foto/Scan SNSP', 'SNSP photo/scan') },
                                    { path: application.graduation_proof_path, label: t('Bukti tanda kelulusan', 'Graduation certificate') },
                                  ] satisfies { path: string | null; label: string }[]).map(({ path, label }) => (
                                    <div key={label} className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]">
                                      <span className="min-w-0 text-xs font-semibold">{label}</span>
                                      {!path ? (
                                        <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">{t('Belum ada', 'Missing')}</span>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={busyDocumentPath === path}
                                          onClick={() => void downloadDocument(path)}
                                          className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-blue-700 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                                        >
                                          <Download aria-hidden="true" className="h-3.5 w-3.5" />
                                          {busyDocumentPath === path ? t('Mengunduh…', 'Downloading…') : t('Unduh berkas', 'Download file')}
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
                                  {whatsappUrl ? (
                                    <>
                                      <p className="text-xs text-slate-600 dark:text-slate-300">
                                        {t('WhatsApp orang tua/wali:', 'Parent/guardian WhatsApp:')} <span className="font-semibold">+{application.guardian_whatsapp}</span>
                                      </p>
                                      <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
                                      >
                                        {t('Siapkan kabar via WhatsApp', 'Prepare WhatsApp update')}
                                      </a>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('Nomor WhatsApp belum tersedia pada data lama ini.', 'No WhatsApp number is available for this legacy application.')}
                                      </p>
                                      <button
                                        type="button"
                                        disabled={busyId === application.id}
                                        onClick={() => void deleteLegacyApplication(application)}
                                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {busyId === application.id ? t('Menghapus…', 'Deleting…') : t('Hapus pendaftar lama', 'Delete legacy applicant')}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
