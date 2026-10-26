'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Download, FileSpreadsheet } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import AdminNavbar from '../components/navbar';

type LetterStatus = 'Baru' | 'Diproses' | 'Selesai';
type StatusFilter = 'Semua' | LetterStatus;

type IncomingLetter = {
  id: string;
  sender_name: string;
  institution: string;
  contact: string;
  letter_number: string;
  letter_date: string | null;
  recipient: string;
  subject: string;
  summary: string;
  attachment_path: string | null;
  attachment_name: string | null;
  status: LetterStatus;
  submitted_at: string;
};

type SpreadsheetRow = Pick<
  IncomingLetter,
  | 'sender_name'
  | 'institution'
  | 'contact'
  | 'letter_number'
  | 'letter_date'
  | 'recipient'
  | 'subject'
  | 'summary'
  | 'attachment_path'
  | 'attachment_name'
  | 'status'
  | 'submitted_at'
>;

const PAGE_SIZE = 20;
const EXPORT_THRESHOLD = 10;
const EXPORT_BATCH_SIZE = 500;
const SIGNED_URL_EXPIRY_SECONDS = 30 * 24 * 60 * 60;
const SIGNED_URL_BATCH_SIZE = 100;
const statuses = ['Baru', 'Diproses', 'Selesai'] as const;

function letterStatusLabel(status: LetterStatus, t: (id: string, en: string) => string): string {
  if (status === 'Baru') return t('Baru', 'New');
  if (status === 'Diproses') return t('Diproses', 'In progress');
  return t('Selesai', 'Completed');
}

export default function AdminSuratMasukPage() {
  const router = useRouter();
  const { t } = useLang();
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalLetters, setTotalLetters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [busyAttachmentPath, setBusyAttachmentPath] = useState('');
  const [exporting, setExporting] = useState(false);
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(() => new Set());

  const toggleLetterDetails = (letterId: string) => {
    setExpandedLetters((current) => {
      const next = new Set(current);
      if (next.has(letterId)) {
        next.delete(letterId);
      } else {
        next.add(letterId);
      }
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    const loadLetters = async () => {
      setLoading(true);
      setErrorMessage('');

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to read incoming mail admin session:', sessionError);
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
        .from('incoming_letters')
        .select('id,sender_name,institution,contact,letter_number,letter_date,recipient,subject,summary,attachment_path,attachment_name,status,submitted_at', { count: 'exact' })
        .order('submitted_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (statusFilter !== 'Semua') query = query.eq('status', statusFilter);
      if (search.trim()) query = query.ilike('sender_name', `%${search.trim()}%`);

      const [lettersResult, totalResult] = await Promise.all([
        query,
        supabase.from('incoming_letters').select('id', { count: 'exact', head: true }),
      ]);

      if (lettersResult.error) {
        console.error('Failed to load incoming mail:', lettersResult.error);
        if (active) setErrorMessage(t('Data surat masuk belum dapat dimuat.', 'Incoming mail could not be loaded.'));
      } else if (active) {
        setLetters(lettersResult.data || []);
        setFilteredCount(lettersResult.count || 0);
      }

      if (totalResult.error) {
        console.error('Failed to count incoming mail:', totalResult.error);
        if (active) setErrorMessage(t('Jumlah surat masuk belum dapat dihitung.', 'The number of incoming letters could not be counted.'));
      } else if (active) {
        setTotalLetters(totalResult.count || 0);
      }

      if (active) setLoading(false);
    };

    void loadLetters();
    return () => { active = false; };
  }, [page, router, search, statusFilter, t]);

  const updateStatus = async (letter: IncomingLetter, status: LetterStatus) => {
    setBusyId(letter.id);
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('incoming_letters')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', letter.id);

      if (error) {
        console.error('Failed to update incoming mail status:', error);
        setErrorMessage(t('Status surat belum berhasil diperbarui.', 'The letter status could not be updated.'));
        return;
      }

      setLetters((current) => current.map((item) => item.id === letter.id ? { ...item, status } : item));
    } catch (error) {
      console.error('Unexpected error while updating incoming mail status:', error);
      setErrorMessage(t('Terjadi kesalahan saat memperbarui status surat.', 'An error occurred while updating the letter status.'));
    } finally {
      setBusyId('');
    }
  };

  const downloadAttachment = async (path: string) => {
    setBusyAttachmentPath(path);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.storage.from('incoming-mail-attachments').download(path);
      if (error) {
        console.error('Failed to download incoming mail attachment:', error);
        setErrorMessage(t('Lampiran gagal diunduh. Pastikan akun Anda memiliki akses admin.', 'The attachment could not be downloaded. Confirm that your account has admin access.'));
        return;
      }

      const objectUrl = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = path.split('/').pop() || 'lampiran-surat';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error('Unexpected error while downloading incoming mail attachment:', error);
      setErrorMessage(t('Terjadi kesalahan saat mengunduh lampiran.', 'An error occurred while downloading the attachment.'));
    } finally {
      setBusyAttachmentPath('');
    }
  };

  const exportSpreadsheet = async () => {
    setExporting(true);
    setErrorMessage('');

    try {
      const allLetters: SpreadsheetRow[] = [];
      for (let offset = 0; ; offset += EXPORT_BATCH_SIZE) {
        const { data, error } = await supabase
          .from('incoming_letters')
          .select('sender_name,institution,contact,letter_number,letter_date,recipient,subject,summary,attachment_path,attachment_name,status,submitted_at')
          .order('submitted_at', { ascending: false })
          .range(offset, offset + EXPORT_BATCH_SIZE - 1);

        if (error) {
          console.error('Failed to export incoming mail spreadsheet:', error);
          setErrorMessage(t('Spreadsheet surat masuk gagal dibuat. Coba lagi.', 'The incoming mail spreadsheet could not be created. Please try again.'));
          return;
        }

        const batch = data || [];
        allLetters.push(...batch);
        if (batch.length < EXPORT_BATCH_SIZE) break;
      }

      const lettersWithAttachments = allLetters.filter((letter) => letter.attachment_path);
      const signedUrls = new Map<string, string>();
      for (let offset = 0; offset < lettersWithAttachments.length; offset += SIGNED_URL_BATCH_SIZE) {
        const batch = lettersWithAttachments.slice(offset, offset + SIGNED_URL_BATCH_SIZE);
        const paths = batch.map((letter) => letter.attachment_path).filter((path): path is string => Boolean(path));
        const { data, error } = await supabase
          .storage
          .from('incoming-mail-attachments')
          .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);

        if (error) {
          console.error('Failed to create signed incoming mail attachment links:', error);
          setErrorMessage(t('Tautan unduh lampiran gagal dibuat. Coba lagi.', 'Download links for attachments could not be created. Please try again.'));
          return;
        }

        for (const item of data || []) {
          if (item.error || !item.path || !item.signedUrl) {
            console.error('Supabase returned an invalid signed incoming mail attachment link:', item.error);
            setErrorMessage(t('Salah satu tautan unduh lampiran tidak berhasil dibuat.', 'A download link for one of the attachments could not be created.'));
            return;
          }
          signedUrls.set(item.path, item.signedUrl);
        }

        if (paths.some((path) => !signedUrls.has(path))) {
          setErrorMessage(t('Tautan unduh salah satu lampiran tidak tersedia.', 'A download link for one of the attachments is unavailable.'));
          return;
        }
      }

      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SMP Muhammadiyah Kembaran';
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet('Surat Masuk', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      const headers = [
        'Tanggal diterima',
        'Nama pengirim',
        'Instansi / organisasi',
        'Nomor WhatsApp',
        'Nomor surat',
        'Tanggal surat',
        'Ditujukan kepada',
        'Perihal',
        'Ringkasan / isi surat',
        'Lampiran',
        'Status',
      ];
      worksheet.addTable({
        name: 'TabelSuratMasuk',
        ref: 'A1',
        headerRow: true,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: headers.map((name) => ({ name, filterButton: true })),
        rows: allLetters.map((letter) => [
          new Date(letter.submitted_at).toLocaleString('id-ID'),
          letter.sender_name,
          letter.institution,
          letter.contact,
          letter.letter_number,
          letter.letter_date || '',
          letter.recipient,
          letter.subject,
          letter.summary,
          letter.attachment_name || (letter.attachment_path ? 'Unduh lampiran' : '—'),
          letterStatusLabel(letter.status, t),
        ]),
      });
      worksheet.columns = [
        { width: 22 },
        { width: 26 },
        { width: 26 },
        { width: 24 },
        { width: 22 },
        { width: 18 },
        { width: 24 },
        { width: 30 },
        { width: 54 },
        { width: 32 },
        { width: 16 },
      ];
      worksheet.getRow(1).height = 30;
      worksheet.getColumn(9).alignment = { vertical: 'top', wrapText: true };
      worksheet.getColumn(10).alignment = { vertical: 'top', wrapText: true };

      allLetters.forEach((letter, index) => {
        if (!letter.attachment_path) return;
        const signedUrl = signedUrls.get(letter.attachment_path);
        if (!signedUrl) return;
        const attachmentCell = worksheet.getCell(index + 2, 10);
        attachmentCell.value = {
          text: letter.attachment_name || t('Unduh lampiran', 'Download attachment'),
          hyperlink: signedUrl,
          tooltip: t('Tautan berlaku selama 30 hari', 'Link expires in 30 days'),
        };
        attachmentCell.font = { color: { argb: 'FF2563EB' }, underline: true };
      });

      const fileBuffer = await workbook.xlsx.writeBuffer();
      const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(fileBuffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `surat-masuk-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error('Unexpected error while creating incoming mail spreadsheet:', error);
      setErrorMessage(t('Terjadi kesalahan saat membuat spreadsheet surat masuk.', 'An error occurred while creating the incoming mail spreadsheet.'));
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Layanan Publik', 'Public Services')}</p>
            <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Surat Masuk', 'Incoming Mail')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('Kelola surat masuk langsung di admin. Data baru disimpan di database sekolah, bukan spreadsheet online.', 'Manage incoming mail in the admin panel. New submissions are stored in the school database, not an online spreadsheet.')}
            </p>
          </div>
          {totalLetters >= EXPORT_THRESHOLD && (
            <div className="grid gap-1 sm:justify-items-end">
              <button
                type="button"
                disabled={exporting}
                onClick={() => void exportSpreadsheet()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
                {exporting ? t('Menyiapkan spreadsheet…', 'Preparing spreadsheet…') : t('Unduh spreadsheet Excel (.xlsx)', 'Download Excel spreadsheet (.xlsx)')}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t(`${totalLetters} surat tersimpan`, `${totalLetters} letters stored`)}
              </span>
            </div>
          )}
        </header>

        {totalLetters < EXPORT_THRESHOLD && (
          <p className="rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-800 dark:border-sky-400/20 dark:bg-sky-400/[0.06] dark:text-sky-200">
            {t(`Spreadsheet unduhan akan tersedia otomatis setelah terkumpul ${EXPORT_THRESHOLD} surat.`, `The spreadsheet download will appear automatically after ${EXPORT_THRESHOLD} letters have been received.`)}
          </p>
        )}

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {errorMessage}
          </p>
        )}

        <section className="grid gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end sm:p-4">
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Cari nama pengirim', 'Search sender name')}
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              placeholder={t('Ketik nama pengirim…', 'Type a sender name…')}
              className="min-h-10 rounded-lg border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Status surat', 'Letter status')}
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPage(0); }}
              className="min-h-10 rounded-lg border border-slate-300/80 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white"
            >
              <option value="Semua">{t('Semua status', 'All statuses')}</option>
              {statuses.map((status) => <option key={status} value={status}>{letterStatusLabel(status, t)}</option>)}
            </select>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredCount} {t('surat', 'letters')}
          </p>
        </section>

        {loading ? (
          <div className="admin-loading" role="status"><span>{t('Memuat surat masuk…', 'Loading incoming mail…')}</span></div>
        ) : letters.length === 0 ? (
          <p className="rounded-2xl border border-slate-200/80 bg-white/70 p-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            {t('Belum ada surat masuk yang sesuai.', 'No matching incoming letters were found.')}
          </p>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
                <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 dark:bg-white/[0.035] dark:text-slate-400">
                  <tr>
                    <th scope="col" className="w-48 px-4 py-3">{t('Tanggal diterima', 'Received')}</th>
                    <th scope="col" className="px-4 py-3">{t('Pengirim / perihal', 'Sender / subject')}</th>
                    <th scope="col" className="w-[22rem] px-4 py-3 text-right">{t('Status surat', 'Letter status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                  {letters.map((letter) => {
                    const isExpanded = expandedLetters.has(letter.id);
                    const detailsId = `letter-details-${letter.id}`;

                    return (
                      <Fragment key={letter.id}>
                        <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.025]">
                          <td className="px-4 py-3 align-middle text-xs font-medium text-slate-500 dark:text-slate-400">
                            {new Date(letter.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="min-w-0 px-4 py-3 align-middle">
                            <p className="break-words text-sm font-bold text-slate-950 dark:text-white">{letter.sender_name}</p>
                            <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">{letter.subject}</p>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <label className="sr-only" htmlFor={`letter-status-${letter.id}`}>
                                {t(`Status surat dari ${letter.sender_name}`, `Letter status for ${letter.sender_name}`)}
                              </label>
                              <select
                                id={`letter-status-${letter.id}`}
                                value={letter.status}
                                disabled={busyId === letter.id}
                                onChange={(event) => void updateStatus(letter, event.target.value as LetterStatus)}
                                className="min-h-9 w-full max-w-56 rounded-lg border border-slate-300/80 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                              >
                                {statuses.map((status) => (
                                  <option key={status} value={status}>{letterStatusLabel(status, t)}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-controls={detailsId}
                                aria-label={t('Lihat selengkapnya', 'See more')}
                                title={t('Lihat selengkapnya', 'See more')}
                                onClick={() => toggleLetterDetails(letter.id)}
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
                                  {[
                                    { label: t('Instansi / organisasi', 'Institution / organization'), value: letter.institution },
                                    { label: t('Nomor WhatsApp', 'WhatsApp number'), value: letter.contact },
                                    { label: t('Nomor surat', 'Letter number'), value: letter.letter_number },
                                    { label: t('Tanggal surat', 'Letter date'), value: letter.letter_date || '—' },
                                    { label: t('Ditujukan kepada', 'Attention to'), value: letter.recipient },
                                    { label: t('Perihal', 'Subject'), value: letter.subject },
                                  ].map(({ label, value }) => (
                                    <div key={label} className="min-w-0 rounded-lg bg-slate-50/80 p-3 dark:bg-white/[0.035]">
                                      <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
                                      <dd className="mt-1 break-words text-sm font-medium">{value || '—'}</dd>
                                    </div>
                                  ))}
                                  <div className="min-w-0 rounded-lg bg-slate-50/80 p-3 sm:col-span-2 xl:col-span-4 dark:bg-white/[0.035]">
                                    <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Ringkasan / isi surat', 'Letter summary / message')}</dt>
                                    <dd className="mt-1 break-words whitespace-pre-wrap text-sm font-medium">{letter.summary || '—'}</dd>
                                  </div>
                                </dl>
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
                                  <span className="min-w-0 break-all text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {letter.attachment_path
                                      ? letter.attachment_name || t('Lampiran surat', 'Letter attachment')
                                      : t('Belum ada lampiran', 'No attachment')}
                                  </span>
                                  {letter.attachment_path && (
                                    <button
                                      type="button"
                                      disabled={busyAttachmentPath === letter.attachment_path}
                                      onClick={() => void downloadAttachment(letter.attachment_path!)}
                                      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                                    >
                                      <Download aria-hidden="true" className="h-4 w-4" />
                                      {busyAttachmentPath === letter.attachment_path ? t('Mengunduh…', 'Downloading…') : t('Unduh lampiran', 'Download attachment')}
                                    </button>
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
          <nav aria-label={t('Halaman surat masuk', 'Incoming mail pages')} className="flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
              className="min-h-11 rounded-xl border border-slate-300/80 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
            >
              {t('Sebelumnya', 'Previous')}
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">{page + 1} / {totalPages}</span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((current) => current + 1)}
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
