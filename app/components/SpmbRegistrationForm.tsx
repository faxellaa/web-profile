'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const fieldClassName =
  'min-h-12 w-full rounded-xl border border-slate-300/80 bg-white/80 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500 sm:text-sm';
const REQUEST_TIMEOUT_MS = 150_000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SCHOOL_WHATSAPP_NUMBER = '6285147777650';
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp';

type UploadDescriptor = {
  key: 'snspsDocument' | 'graduationProof';
  path: string;
  token: string;
};

type ApiResponse = {
  ok?: boolean;
  error?: string;
  applicationId?: string;
  uploads?: UploadDescriptor[];
};

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isApiResponse(value: unknown): value is ApiResponse {
  return isJsonObject(value)
    && (value.ok === undefined || typeof value.ok === 'boolean')
    && (value.error === undefined || typeof value.error === 'string')
    && (value.applicationId === undefined || typeof value.applicationId === 'string')
    && (value.uploads === undefined || (
      Array.isArray(value.uploads)
      && value.uploads.every((upload) => isJsonObject(upload)
        && (upload.key === 'snspsDocument' || upload.key === 'graduationProof')
        && typeof upload.path === 'string'
        && typeof upload.token === 'string')
    ));
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error('Server mengirim respons yang tidak valid.');
  }

  if (!isApiResponse(result)) {
    throw new Error('Server mengirim respons yang tidak valid.');
  }
  return result;
}

export default function SpmbRegistrationForm() {
  const { t } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setMessage('');
    setIsSuccess(false);
    setWhatsappUrl('');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const formData = new FormData(form);
      const snspsDocument = formData.get('snspsDocument');
      const graduationProof = formData.get('graduationProof');
      if (!(snspsDocument instanceof File) || !(graduationProof instanceof File)
        || snspsDocument.size === 0 || graduationProof.size === 0) {
        throw new Error(t('Kedua berkas pendukung wajib diunggah.', 'Both supporting documents are required.'));
      }
      if (snspsDocument.size > MAX_FILE_SIZE || graduationProof.size > MAX_FILE_SIZE) {
        throw new Error(t('Ukuran setiap berkas maksimal 10 MB.', 'Each file must be 10 MB or smaller.'));
      }
      if (!ALLOWED_FILE_TYPES.has(snspsDocument.type) || !ALLOWED_FILE_TYPES.has(graduationProof.type)) {
        throw new Error(t('Berkas harus berupa foto, PDF, atau Word (.doc/.docx).', 'Files must be photos, PDF, or Word (.doc/.docx).'));
      }

      const payload = {
        fullName: formData.get('fullName'),
        nickname: formData.get('nickname'),
        guardianWhatsapp: formData.get('guardianWhatsapp'),
        schoolOrigin: formData.get('schoolOrigin'),
        birthPlace: formData.get('birthPlace'),
        birthDate: formData.get('birthDate'),
        nik: formData.get('nik'),
        guardianConsent: formData.get('guardianConsent') === 'on',
        website: formData.get('website'),
        snspsDocument: { type: snspsDocument.type, size: snspsDocument.size },
        graduationProof: { type: graduationProof.type, size: graduationProof.size },
      };

      const prepareResponse = await fetch('/api/spmb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, action: 'prepare' }),
        signal: controller.signal,
      });
      const prepareResult = await readApiResponse(prepareResponse);
      if (!prepareResponse.ok || !prepareResult.ok || !prepareResult.applicationId || !prepareResult.uploads) {
        throw new Error(prepareResult.error || t('Tautan unggah berkas belum berhasil dibuat.', 'Upload links could not be created.'));
      }

      const uploads = new Map(prepareResult.uploads.map((upload) => [upload.key, upload]));
      const uploadTasks = [
        { key: 'snspsDocument' as const, file: snspsDocument },
        { key: 'graduationProof' as const, file: graduationProof },
      ];
      await Promise.all(uploadTasks.map(async ({ key, file }) => {
        const upload = uploads.get(key);
        if (!upload) throw new Error(t('Tautan unggah berkas tidak lengkap.', 'An upload link is missing.'));
        const { error } = await supabase.storage
          .from('spmb-documents')
          .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type });
        if (error) throw new Error(error.message);
      }));

      const response = await fetch('/api/spmb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, action: 'submit', applicationId: prepareResult.applicationId }),
        signal: controller.signal,
      });
      const result = await readApiResponse(response);
      if (!response.ok || !result.ok || !result.applicationId) {
        throw new Error(result.error || t('Pendaftaran belum berhasil dikirim.', 'The registration could not be submitted.'));
      }

      const submittedName = formData.get('fullName');
      const applicantName = typeof submittedName === 'string' ? submittedName.trim() : '';
      const whatsappMessage = t(
        `Assalamu’alaikum, saya orang tua/wali dari ${applicantName}. Saya sudah mengirim pendaftaran SPMB SMP Muhammadiyah Kembaran. Mohon konfirmasi bahwa pendaftaran kami sudah diterima. Terima kasih.`,
        `Hello, I am the parent/guardian of ${applicantName}. I have submitted an SPMB application to SMP Muhammadiyah Kembaran. Please confirm that you have received our application. Thank you.`,
      );
      form.reset();
      setWhatsappUrl(`https://wa.me/${SCHOOL_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`);
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to submit SPMB application:', error);
      const timedOut = error instanceof Error && error.name === 'AbortError';
      setMessage(timedOut
        ? t('Waktu pengiriman terlalu lama. Status pendaftaran belum dapat dipastikan. Hubungi panitia sebelum mencoba mengirim ulang.', 'The request took too long and the registration status is unknown. Contact the committee before trying again.')
        : error instanceof Error && error.message !== 'Failed to fetch'
          ? error.message
          : t('Koneksi bermasalah. Status pendaftaran belum dapat dipastikan. Hubungi panitia sebelum mencoba mengirim ulang.', 'The connection failed and the registration status is unknown. Contact the committee before trying again.'));
    } finally {
      window.clearTimeout(timeoutId);
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
            'Isi seluruh data dengan benar dan unggah kedua berkas pendukung untuk melanjutkan pendaftaran.',
            'Complete all information accurately and upload both supporting documents to continue the registration.',
          )}
        </p>
      </header>

      {isSuccess ? (
        <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-10">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-300" />
          <h3 className="mt-4 text-2xl font-black text-emerald-900 dark:text-emerald-100">
            {t('Pendaftaran berhasil dikirim!', 'Registration submitted successfully!')}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            {t('Data dan berkas sudah tersimpan. Kamu bisa mengirim konfirmasi ke WhatsApp pusat bantuan sekolah melalui tombol berikut.', 'Your information and documents have been saved. You can confirm your submission with the school via WhatsApp using the button below.')}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            {t('Konfirmasi pendaftaran via WhatsApp sekolah', 'Confirm registration via school WhatsApp')}
          </a>
          <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">
            {t('Pesan sudah disiapkan otomatis. Periksa lalu tekan Kirim di WhatsApp.', 'The message is prefilled. Review it, then tap Send in WhatsApp.')}
          </p>
        </div>
      ) : (
        <>
          {message && (
            <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {message}
            </p>
          )}
          {submitting && (
            <p role="status" aria-live="polite" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
              {t('Mengirim data dan menyimpan berkas. Mohon tunggu dan jangan tutup halaman ini.', 'Submitting your information and saving files. Please wait and keep this page open.')}
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
            {t('Nama lengkap', 'Full name')}
            <input name="fullName" required maxLength={120} autoComplete="name" className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Nama panggilan', 'Nickname')}
            <input name="nickname" required maxLength={80} className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
            {t('Nomor WhatsApp orang tua/wali', 'Parent/guardian WhatsApp number')}
            <input
              name="guardianWhatsapp"
              type="text"
              inputMode="numeric"
              pattern="628[0-9]{9,10}"
              required
              minLength={12}
              maxLength={13}
              autoComplete="tel"
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 13);
              }}
              placeholder={t('Contoh: 6281234567890', 'Example: 6281234567890')}
              aria-describedby="guardian-whatsapp-help"
              className={fieldClassName}
            />
            <span id="guardian-whatsapp-help" className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
              {t('Gunakan awalan 62 dan masukkan 12–13 digit angka saja.', 'Use the 62 prefix and enter 12–13 digits only.')}
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
            {t('Asal sekolah', 'Previous school')}
            <input name="schoolOrigin" required maxLength={180} autoComplete="organization" className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Tempat lahir', 'Place of birth')}
            <input name="birthPlace" required maxLength={100} autoComplete="address-level2" className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Tanggal lahir', 'Date of birth')}
            <input name="birthDate" type="date" required className={fieldClassName} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
            {t('NIK pada Kartu Keluarga', 'National ID on Family Card')}
            <input
              name="nik"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{16}"
              minLength={16}
              maxLength={16}
              required
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 16);
              }}
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
            {t('Berkas pendukung', 'Supporting documents')}
          </legend>
          <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Foto/Scan SNSP', 'SNSP photo/scan')}
            <input
              name="snspsDocument"
              type="file"
              accept={DOCUMENT_ACCEPT}
              required
              className={`${fieldClassName} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 dark:file:bg-white/10 dark:file:text-sky-300`}
            />
            <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
              {t('Foto (JPG/PNG/WEBP), PDF, atau Word (.doc/.docx), maksimal 10 MB.', 'Photo (JPG/PNG/WEBP), PDF, or Word (.doc/.docx), up to 10 MB.')}
            </span>
          </label>
          <label className="grid content-start gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('Foto/Scan bukti tanda kelulusan', 'Graduation certificate photo/scan')}
            <input
              name="graduationProof"
              type="file"
              accept={DOCUMENT_ACCEPT}
              required
              className={`${fieldClassName} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 dark:file:bg-white/10 dark:file:text-sky-300`}
            />
            <span className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">
              {t('Foto (JPG/PNG/WEBP), PDF, atau Word (.doc/.docx), maksimal 10 MB.', 'Photo (JPG/PNG/WEBP), PDF, or Word (.doc/.docx), up to 10 MB.')}
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
              'Saya orang tua/wali calon siswa dan menyetujui data ini digunakan untuk proses pendaftaran serta dihubungi melalui WhatsApp terkait SPMB.',
              'I am the applicant’s parent/guardian and consent to this information being used for SPMB processing and to be contacted by WhatsApp about the application.',
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
        </>
      )}
    </section>
  );
}
