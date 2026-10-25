import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE * 2 + 128_000;
const SUPABASE_REQUEST_TIMEOUT_MS = 30_000;
const ALLOWED_FILE_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
]);
const BUCKET_NAME = 'spmb-documents';

export const runtime = 'nodejs';

function textField(formData: FormData, name: string, maxLength: number, required = false): string {
  const value = formData.get(name);
  if (typeof value !== 'string') {
    throw new Error(`Data ${name} tidak valid.`);
  }

  const trimmed = value.trim();
  if (required && !trimmed) {
    throw new Error(`Kolom ${name} wajib diisi.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`Kolom ${name} terlalu panjang.`);
  }
  return trimmed;
}

function dateField(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function normalizeWhatsappNumber(value: string): string {
  if (!/^[0-9+\s().-]+$/.test(value)) {
    throw new Error('Nomor WhatsApp hanya boleh berisi angka dan tanda +, spasi, atau tanda hubung.');
  }

  const digits = value.replace(/\D/g, '');
  const normalized = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('62')
      ? digits
      : digits.startsWith('8')
        ? `62${digits}`
        : '';

  if (!/^62[0-9]{8,13}$/.test(normalized)) {
    throw new Error('Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau +62 8xxxxxxxxxx.');
  }

  return normalized;
}

function attachmentField(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  if (value === null) return null;
  if (!(value instanceof File)) {
    throw new Error('Format berkas tidak valid.');
  }
  if (value.size === 0) return null;
  if (value.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran setiap berkas maksimal 10 MB.');
  }
  if (!ALLOWED_FILE_TYPES.has(value.type)) {
    throw new Error('Berkas hanya boleh berupa PDF, JPG, atau PNG.');
  }
  return value;
}

function getServerSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return null;

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init) => {
        const timeoutSignal = AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS);
        const signal = init?.signal
          ? AbortSignal.any([init.signal, timeoutSignal])
          : timeoutSignal;
        return fetch(input, { ...init, signal });
      },
    },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  let isSameOrigin = false;
  if (origin) {
    try {
      isSameOrigin = new URL(origin).origin === new URL(request.url).origin;
    } catch {
      isSameOrigin = false;
    }
  }
  if (!isSameOrigin) {
    return Response.json({ error: 'Permintaan tidak valid.' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength > MAX_REQUEST_SIZE) {
    return Response.json({ error: 'Ukuran total berkas melebihi batas.' }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error('Invalid SPMB form data:', error);
    return Response.json({ error: 'Format formulir tidak valid.' }, { status: 400 });
  }

  if (formData.get('website')) {
    return Response.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  let application: {
    full_name: string;
    nickname: string;
    school_origin: string;
    birth_place: string;
    birth_date: string;
    nik: string;
    guardian_whatsapp: string;
    snsps_document_path: string | null;
    graduation_proof_path: string | null;
  };
  let snspsDocument: File | null;
  let graduationProof: File | null;

  try {
    const birthDate = textField(formData, 'birthDate', 10, true);
    const nik = textField(formData, 'nik', 16, true);
    if (!dateField(birthDate)) {
      throw new Error('Tanggal lahir tidak valid.');
    }
    if (!/^\d{16}$/.test(nik)) {
      throw new Error('NIK harus terdiri dari 16 angka.');
    }
    if (formData.get('guardianConsent') !== 'on') {
      throw new Error('Persetujuan orang tua/wali wajib diberikan.');
    }

    snspsDocument = attachmentField(formData, 'snspsDocument');
    graduationProof = attachmentField(formData, 'graduationProof');
    const guardianWhatsapp = normalizeWhatsappNumber(textField(formData, 'guardianWhatsapp', 30, true));
    application = {
      full_name: textField(formData, 'fullName', 120, true),
      nickname: textField(formData, 'nickname', 80, true),
      school_origin: textField(formData, 'schoolOrigin', 180),
      birth_place: textField(formData, 'birthPlace', 100, true),
      birth_date: birthDate,
      nik,
      guardian_whatsapp: guardianWhatsapp,
      snsps_document_path: null,
      graduation_proof_path: null,
    };
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Data pendaftaran tidak valid.' },
      { status: 400 },
    );
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return Response.json(
      { error: 'Pendaftaran online belum dikonfigurasi. Silakan hubungi administrator sekolah.' },
      { status: 503 },
    );
  }

  const applicationId = crypto.randomUUID();
  const uploadedPaths: string[] = [];
  const upload = async (file: File | null, key: 'snsps_document_path' | 'graduation_proof_path', fileName: string) => {
    if (!file) return;
    const extension = ALLOWED_FILE_TYPES.get(file.type);
    if (!extension) throw new Error('Jenis berkas tidak didukung.');

    const path = `${applicationId}/${fileName}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    uploadedPaths.push(path);
    application[key] = path;
  };

  try {
    await upload(snspsDocument, 'snsps_document_path', 'snsps');
    await upload(graduationProof, 'graduation_proof_path', 'bukti-kelulusan');
  } catch (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await supabase.storage.from(BUCKET_NAME).remove(uploadedPaths);
      if (cleanupError) console.error('Failed to remove incomplete SPMB uploads:', cleanupError);
    }
    console.error('Failed to upload SPMB documents:', error);
    return Response.json(
      { error: 'Berkas belum berhasil disimpan. Periksa format dan ukuran, lalu coba lagi.' },
      { status: 502 },
    );
  }

  const { error } = await supabase.from('spmb_applications').insert({
    id: applicationId,
    ...application,
    status: 'Baru',
  });

  if (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await supabase.storage.from(BUCKET_NAME).remove(uploadedPaths);
      if (cleanupError) console.error('Failed to remove orphaned SPMB uploads:', cleanupError);
    }
    console.error('Failed to save SPMB application:', error);
    return Response.json(
      { error: 'Pendaftaran belum berhasil disimpan. Silakan coba lagi.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, applicationId }, { status: 201 });
}
