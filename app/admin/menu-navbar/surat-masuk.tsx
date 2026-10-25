'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet } from 'lucide-react';
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
  | 'attachment_name'
  | 'status'
  | 'submitted_at'
>;

const PAGE_SIZE = 20;
const EXPORT_THRESHOLD = 20;
const EXPORT_BATCH_SIZE = 500;
const statuses = ['Baru', 'Diproses', 'Selesai'] as const;

function csvCell(value: string | null): string {
  let text = value ?? '';
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

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
          .select('sender_name,institution,contact,letter_number,letter_date,recipient,subject,summary,attachment_name,status,submitted_at')
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

      const rows = [
        [
          'Tanggal diterima',
          'Nama pengirim',
          'Instansi / organisasi',
          'Nomor telepon atau email',
          'Nomor surat',
          'Tanggal surat',
          'Ditujukan kepada',
          'Perihal',
          'Ringkasan / isi surat',
          'Lampiran',
          'Status',
        ],
        ...allLetters.map((letter) => [
          new Date(letter.submitted_at).toLocaleString('id-ID'),
          letter.sender_name,
          letter.institution,
          letter.contact,
          letter.letter_number,
          letter.letter_date,
          letter.recipient,
          letter.subject,
          letter.summary,
          letter.attachment_name,
          letterStatusLabel(letter.status, t),
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
      const objectUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `surat-masuk-${new Date().toISOString().slice(0, 10)}.csv`;
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
                {exporting ? t('Menyiapkan spreadsheet…', 'Preparing spreadsheet…') : t('Unduh spreadsheet (.csv)', 'Download spreadsheet (.csv)')}
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

        <section className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end sm:p-5">
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Cari nama pengirim', 'Search sender name')}
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(0); }}
              placeholder={t('Ketik nama pengirim…', 'Type a sender name…')}
              className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm"
            />
          </label>
          <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('Status surat', 'Letter status')}
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPage(0); }}
              className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950 dark:text-white"
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
          <section className="grid gap-4">
            {letters.map((letter) => (
              <article key={letter.id} className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
                <div className="grid gap-4 border-b border-slate-200/80 pb-4 dark:border-white/10 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {new Date(letter.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <h2 className="mt-1 break-words text-lg font-black text-slate-950 dark:text-white">{letter.sender_name}</h2>
                    <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{letter.subject}</p>
                  </div>
                  <label className="grid gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t('Status surat', 'Letter status')}
                    <select
                      value={letter.status}
                      disabled={busyId === letter.id}
                      onChange={(event) => void updateStatus(letter, event.target.value as LetterStatus)}
                      className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                    >
                      {statuses.map((status) => <option key={status} value={status}>{letterStatusLabel(status, t)}</option>)}
                    </select>
                  </label>
                </div>

                <details className="pt-4">
                  <summary className="w-fit cursor-pointer rounded-lg py-1 text-sm font-bold text-blue-700 outline-none hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-sky-300 dark:hover:text-sky-200">
                    {t('Lihat isi surat dan lampiran', 'View letter details and attachment')}
                  </summary>
                  <dl className="mt-4 grid gap-3 text-sm">
                    {[
                      { label: t('Instansi / organisasi', 'Institution / organization'), value: letter.institution },
                      { label: t('Nomor telepon atau email', 'Phone number or email'), value: letter.contact },
                      { label: t('Nomor surat', 'Letter number'), value: letter.letter_number },
                      { label: t('Tanggal surat', 'Letter date'), value: letter.letter_date || '' },
                      { label: t('Ditujukan kepada', 'Attention to'), value: letter.recipient },
                      { label: t('Perihal', 'Subject'), value: letter.subject },
                    ].map(({ label, value }) => (
                      <div key={label} className="grid gap-1 border-b border-slate-200/70 pb-3 dark:border-white/10 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
                        <dd className="break-words font-medium">{value || '—'}</dd>
                      </div>
                    ))}
                    <div className="grid gap-1 border-b border-slate-200/70 pb-3 dark:border-white/10 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Ringkasan / isi surat', 'Letter summary / message')}</dt>
                      <dd className="break-words whitespace-pre-wrap font-medium">{letter.summary}</dd>
                    </div>
                  </dl>
                  {letter.attachment_path && (
                    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                      <span className="min-w-0 break-all text-sm font-semibold">{letter.attachment_name || t('Lampiran surat', 'Letter attachment')}</span>
                      <button
                        type="button"
                        disabled={busyAttachmentPath === letter.attachment_path}
                        onClick={() => {
                          if (letter.attachment_path) void downloadAttachment(letter.attachment_path);
                        }}
                        className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                      >
                        <Download aria-hidden="true" className="h-4 w-4" />
                        {busyAttachmentPath === letter.attachment_path ? t('Mengunduh…', 'Downloading…') : t('Unduh lampiran', 'Download attachment')}
                      </button>
                    </div>
                  )}
                </details>
              </article>
            ))}
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
