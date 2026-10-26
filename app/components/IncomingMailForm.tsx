'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { isValidIndonesianMobileNumber } from '@/lib/phone';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const inputClassName =
  'w-full border border-slate-300/70 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-500';

export default function IncomingMailForm({ onSuccess }: { onSuccess: (message: string) => void }) {
  const { t } = useLang();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'error'; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('attachment');
    const contact = formData.get('contact');

    if (typeof contact !== 'string' || !isValidIndonesianMobileNumber(contact.trim())) {
      setStatus({
        type: 'error',
        message: t(
          'Masukkan nomor WhatsApp aktif berawalan 62 dengan 12–13 digit angka.',
          'Enter an active WhatsApp number starting with 62 and containing 12–13 digits.',
        ),
      });
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      setStatus({ type: 'error', message: t('Lampiran wajib diunggah.', 'An attachment is required.') });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus({ type: 'error', message: t('Ukuran lampiran maksimal 5 MB.', 'Attachments must be 5 MB or smaller.') });
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setStatus({ type: 'error', message: t('Lampiran harus berupa foto, PDF, atau Word (.doc/.docx).', 'Attachments must be a photo, PDF, or Word (.doc/.docx) file.') });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/surat-masuk', {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || t('Surat belum berhasil dikirim. Silakan coba lagi.', 'The letter could not be submitted. Please try again.'));
      }

      form.reset();
      onSuccess(t(
          'Data dan lampiran sudah diterima oleh administrasi sekolah. Surat akan diperiksa dan diteruskan kepada pihak yang dituju.',
          'Your letter and attachment have been received by the school office. They will be reviewed and forwarded to the intended recipient.',
        ));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error
          ? error.message
          : t('Terjadi kendala saat mengirim surat. Silakan coba lagi.', 'There was a problem submitting your letter. Please try again.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="surat-masuk" className="relative z-10 mx-auto max-w-6xl">
      <div className="relative overflow-hidden border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-black sm:p-10">
        <div className="relative">
          <header className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-400">
              {t('Layanan Administrasi', 'Administration')}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {t('Form Surat Masuk', 'Incoming Mail Form')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {t(
                'Kirim surat untuk SMP Muhammadiyah Kembaran. Data akan diteruskan ke administrasi sekolah.',
                'Send a letter to SMP Muhammadiyah Kembaran. Your details will be forwarded to the school office.',
              )}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Nama pengirim', 'Sender name')}</span>
              <input className={inputClassName} name="senderName" autoComplete="name" maxLength={120} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Instansi / organisasi', 'Institution / organization')}</span>
              <input className={inputClassName} name="institution" maxLength={160} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Nomor WhatsApp aktif', 'Active WhatsApp number')}</span>
              <input
                className={inputClassName}
                name="contact"
                type="tel"
                inputMode="numeric"
                pattern="628[0-9]{9,10}"
                minLength={12}
                maxLength={13}
                autoComplete="tel"
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 13);
                }}
                placeholder={t('Contoh: 6281234567890', 'Example: 6281234567890')}
                aria-describedby="contact-help"
                required
              />
              <span id="contact-help" className="block text-xs font-normal leading-5 text-slate-600 dark:text-slate-400">
                {t(
                  'Gunakan nomor WhatsApp yang aktif, awalan 62, dan 12–13 digit angka saja.',
                  'Use an active WhatsApp number with the 62 prefix and 12–13 digits only.',
                )}
              </span>
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Nomor surat', 'Letter number')}</span>
              <input className={inputClassName} name="letterNumber" maxLength={100} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Tanggal surat', 'Letter date')}</span>
              <input className={inputClassName} name="letterDate" type="date" required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Ditujukan kepada', 'Attention to')}</span>
              <input className={inputClassName} name="recipient" maxLength={120} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200 md:col-span-2">
              <span>{t('Perihal', 'Subject')}</span>
              <input className={inputClassName} name="subject" maxLength={200} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200 md:col-span-2">
              <span>{t('Ringkasan / isi surat', 'Letter summary / message')}</span>
              <textarea className={`${inputClassName} min-h-32 resize-y`} name="summary" maxLength={5000} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200 md:col-span-2">
              <span>{t('Lampiran (foto, PDF, Word; maksimal 5 MB)', 'Attachment (photo, PDF, Word; 5 MB maximum)')}</span>
              <input
                className={`${inputClassName} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 dark:file:bg-white/10 dark:file:text-sky-300`}
                name="attachment"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
                required
              />
              <span className="block text-xs font-normal text-slate-600 dark:text-slate-400">
                {t('Foto (JPG/PNG/WEBP), PDF, atau Word (.doc/.docx).', 'Photo (JPG/PNG/WEBP), PDF, or Word (.doc/.docx).')}
              </span>
            </label>

            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="flex flex-col gap-4 md:col-span-2">
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                {t('Semua kolom dan lampiran wajib diisi.', 'All fields and the attachment are required.')}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-12 w-fit self-end items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting
                  ? t('Mengirim...', 'Sending...')
                  : t('Kirim Surat', 'Submit Letter')}
              </button>
            </div>
          </form>
          {status && (
            <div
              role="alert"
              aria-live="assertive"
              className="fixed left-4 right-4 top-4 z-50 flex items-start gap-3 rounded-xl border border-rose-200 bg-white p-4 text-rose-950 shadow-xl dark:border-rose-400/30 dark:bg-slate-900 dark:text-rose-100 sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-md"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
              <p className="flex-1 text-sm font-semibold leading-6">{status.message}</p>
              <button
                type="button"
                onClick={() => setStatus(null)}
                aria-label={t('Tutup notifikasi', 'Dismiss notification')}
                className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
