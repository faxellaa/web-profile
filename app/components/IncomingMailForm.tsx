'use client';

import { useState, type FormEvent } from 'react';
import { useLang } from '@/lib/i18n';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const inputClassName =
  'w-full border border-slate-300/70 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-500';

export default function IncomingMailForm() {
  const { t } = useLang();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('attachment');

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        setStatus({ type: 'error', message: t('Ukuran lampiran maksimal 5 MB.', 'Attachments must be 5 MB or smaller.') });
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setStatus({ type: 'error', message: t('Lampiran hanya boleh berupa PDF, JPG, atau PNG.', 'Attachments must be PDF, JPG, or PNG files.') });
        return;
      }
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
      setStatus({
        type: 'success',
        message: t('Surat berhasil dikirim. Terima kasih.', 'Your letter was submitted successfully. Thank you.'),
      });
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
      <div className="relative overflow-hidden border border-white/70 bg-linear-to-br from-sky-200/60 via-white/50 to-violet-200/50 p-6 shadow-[0_30px_80px_-40px_rgba(56,189,248,0.6)] backdrop-blur-2xl dark:border-white/10 dark:from-sky-500/15 dark:via-white/[0.03] dark:to-indigo-500/15 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/35 blur-3xl dark:bg-indigo-500/15" />

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
              <span>{t('Nama pengirim', 'Sender name')} *</span>
              <input className={inputClassName} name="senderName" autoComplete="name" maxLength={120} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Instansi / organisasi', 'Institution / organization')}</span>
              <input className={inputClassName} name="institution" maxLength={160} />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Nomor telepon atau email', 'Phone number or email')} *</span>
              <input className={inputClassName} name="contact" autoComplete="email" maxLength={160} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Nomor surat', 'Letter number')}</span>
              <input className={inputClassName} name="letterNumber" maxLength={100} />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Tanggal surat', 'Letter date')}</span>
              <input className={inputClassName} name="letterDate" type="date" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <span>{t('Ditujukan kepada', 'Attention to')}</span>
              <input className={inputClassName} name="recipient" maxLength={120} />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200 md:col-span-2">
              <span>{t('Perihal', 'Subject')} *</span>
              <input className={inputClassName} name="subject" maxLength={200} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200 md:col-span-2">
              <span>{t('Ringkasan / isi surat', 'Letter summary / message')} *</span>
              <textarea className={`${inputClassName} min-h-32 resize-y`} name="summary" maxLength={5000} required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-800 dark:text-slate-200 md:col-span-2">
              <span>{t('Lampiran (PDF, JPG, PNG; maksimal 5 MB)', 'Attachment (PDF, JPG, PNG; 5 MB maximum)')}</span>
              <input
                className={`${inputClassName} file:mr-4 file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white dark:file:bg-white dark:file:text-slate-900`}
                name="attachment"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              />
            </label>

            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="flex flex-col gap-4 md:col-span-2">
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                {t('Kolom bertanda * wajib diisi. Lampiran bersifat opsional.', 'Fields marked * are required. Attachments are optional.')}
              </p>
              {status && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`border px-4 py-3 text-sm ${
                    status.type === 'success'
                      ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'border-rose-600/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {status.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-fit bg-slate-950 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-sky-200"
              >
                {isSubmitting
                  ? t('Mengirim...', 'Sending...')
                  : t('Kirim Surat', 'Submit Letter')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
