'use client';

import { useState, type FormEvent } from 'react';
import { useLang } from '@/lib/i18n';

const fieldClassName =
  'min-h-12 w-full rounded-xl border border-slate-300/80 bg-white/80 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 sm:text-sm';

export default function SpmbRegistrationForm() {
  const { t } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const response = await fetch('/api/spmb', {
        method: 'POST',
        body: new FormData(form),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setMessage(result.error || t('Pendaftaran belum berhasil dikirim.', 'The registration could not be submitted.'));
        return;
      }

      form.reset();
      setIsSuccess(true);
      setMessage(t(
        'Pendaftaran berhasil dikirim. Data dan berkas tersimpan dengan aman untuk diperiksa panitia.',
        'Registration submitted. Your information and documents are securely stored for the committee to review.',
      ));
    } catch (error) {
      console.error('Failed to submit SPMB application:', error);
      setMessage(t(
        'Koneksi sedang bermasalah. Periksa internet lalu coba kirim kembali.',
        'The connection failed. Check your internet and try submitting again.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="formulir-pendaftaran" className="scroll-mt-28 rounded-3xl border border-white/75 bg-white/60 p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:p-8 lg:p-10">
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-sky-300">
          {t('SPMB Online', 'Online Admission')}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          {t('Data calon siswa', 'Applicant information')}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t(
            'Isi data Ananda dengan benar. Kolom bertanda * wajib diisi. Panitia akan menggunakan data ini untuk proses penerimaan murid baru.',
            'Please enter the applicant’s information accurately. Fields marked * are required. The committee will use this information for admission.',
          )}
        </p>
      </header>

      {message && (
        <p
          role={isSuccess ? 'status' : 'alert'}
          className={`mb-6 rounded-xl border p-4 text-sm leading-6 ${
            isSuccess
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200'
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={submit} className="space-y-7">
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Nama lengkap', 'Full name')} *
            <input name="fullName" required maxLength={120} autoComplete="name" className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Nama panggilan', 'Nickname')} *
            <input name="nickname" required maxLength={80} className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
            {t('Asal sekolah', 'Previous school')}
            <input name="schoolOrigin" maxLength={180} autoComplete="organization" className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Tempat lahir', 'Place of birth')} *
            <input name="birthPlace" required maxLength={100} autoComplete="address-level2" className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Tanggal lahir', 'Date of birth')} *
            <input name="birthDate" type="date" required className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
            {t('NIK pada Kartu Keluarga', 'National ID on Family Card')} *
            <input
              name="nik"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{16}"
              minLength={16}
              maxLength={16}
              required
              aria-describedby="nik-help"
              className={fieldClassName}
            />
            <span id="nik-help" className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
              {t('Masukkan 16 angka sesuai NIK pada Kartu Keluarga.', 'Enter the 16-digit ID shown on the Family Card.')}
            </span>
          </label>
        </div>

        <fieldset className="grid gap-5 border-t border-slate-200/80 pt-6 dark:border-white/10 md:grid-cols-2">
          <legend className="px-1 text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('Berkas pendukung (opsional)', 'Supporting documents (optional)')}
          </legend>
          <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Foto/Scan SNSP', 'SNSP photo/scan')}
            <input
              name="snspsDocument"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className={`${fieldClassName} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 dark:file:bg-white/10 dark:file:text-sky-300`}
            />
            <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
              {t('1 berkas, PDF/JPG/PNG, maksimal 10 MB.', '1 file, PDF/JPG/PNG, up to 10 MB.')}
            </span>
          </label>
          <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Foto/Scan bukti tanda kelulusan', 'Graduation certificate photo/scan')}
            <input
              name="graduationProof"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className={`${fieldClassName} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 dark:file:bg-white/10 dark:file:text-sky-300`}
            />
            <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
              {t('1 berkas, PDF/JPG/PNG, maksimal 10 MB.', '1 file, PDF/JPG/PNG, up to 10 MB.')}
            </span>
          </label>
        </fieldset>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/55 p-4 text-sm leading-6 text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
          <input
            name="guardianConsent"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
          />
          <span>
            {t(
              'Saya orang tua/wali calon siswa dan menyetujui data ini digunakan untuk proses pendaftaran SPMB.',
              'I am the applicant’s parent/guardian and consent to this information being used for the SPMB admission process.',
            )}
          </span>
        </label>

        <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t(
              'Data pendaftaran dan berkas hanya dapat dibuka oleh admin sekolah yang berwenang.',
              'Registration data and documents can only be accessed by authorized school administrators.',
            )}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {submitting ? t('Mengirim pendaftaran…', 'Submitting…') : t('Kirim pendaftaran', 'Submit registration')}
          </button>
        </div>
      </form>
    </section>
  );
}
