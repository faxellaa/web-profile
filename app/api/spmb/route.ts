import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_METADATA_REQUEST_SIZE = 32_000;
const SUPABASE_REQUEST_TIMEOUT_MS = 30_000;
const ALLOWED_FILE_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['application/msword', 'doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const BUCKET_NAME = 'spmb-documents';
const DOCUMENT_KEYS = ['snspsDocument', 'graduationProof'] as const;

type DocumentKey = (typeof DOCUMENT_KEYS)[number];
import { isValidIndonesianMobileNumber } from '@/lib/phone';

type JsonObject = Record<string, unknown>;
type Applicant = {
  full_name: string;
  nickname: string;
  school_origin: string;
  birth_place: string;
  birth_date: string;
  nik: string;
  guardian_whatsapp: string;
};
type DocumentDetails = {
  type: string;
  extension: string;
  size: number;
};

export const runtime = 'nodejs';

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function textField(body: JsonObject, name: string, maxLength: number): string {
  const value = body[name];
  if (typeof value !== 'string') {
    throw new Error(`Data ${name} tidak valid.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
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

function validateWhatsappNumber(value: string): string {
  if (!isValidIndonesianMobileNumber(value)) {
    throw new Error('Nomor WhatsApp harus berawalan 62 dan terdiri dari 12–13 digit angka.');
  }

  return value;
}

function parseApplicant(body: JsonObject): Applicant {
  if (body.guardianConsent !== true) {
    throw new Error('Persetujuan orang tua/wali wajib diberikan.');
  }

  const birthDate = textField(body, 'birthDate', 10);
  if (!dateField(birthDate)) {
    throw new Error('Tanggal lahir tidak valid.');
  }

  const nik = textField(body, 'nik', 16);
  if (!/^\d{16}$/.test(nik)) {
    throw new Error('NIK harus terdiri dari 16 angka.');
  }

  return {
    full_name: textField(body, 'fullName', 120),
    nickname: textField(body, 'nickname', 80),
    school_origin: textField(body, 'schoolOrigin', 180),
    birth_place: textField(body, 'birthPlace', 100),
    birth_date: birthDate,
    nik,
    guardian_whatsapp: validateWhatsappNumber(textField(body, 'guardianWhatsapp', 13)),
  };
}

function parseDocument(body: JsonObject, key: DocumentKey): DocumentDetails {
  const document = body[key];
  if (!isJsonObject(document)) {
    throw new Error(`Berkas ${key} tidak valid.`);
  }

  const type = document.type;
  const size = document.size;
  if (typeof type !== 'string') {
    throw new Error(`Format berkas ${key} tidak valid.`);
  }

  const extension = ALLOWED_FILE_TYPES.get(type);
  if (!extension) {
    throw new Error('Berkas harus berupa foto, PDF, atau Word (.doc/.docx).');
  }
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || size > MAX_FILE_SIZE) {
    throw new Error('Ukuran setiap berkas harus lebih dari 0 dan maksimal 10 MB.');
  }

  return { type, extension, size };
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
  if (!Number.isFinite(contentLength) || contentLength > MAX_METADATA_REQUEST_SIZE) {
    return Response.json({ error: 'Ukuran data formulir terlalu besar.' }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('Invalid SPMB request body:', error);
    return Response.json({ error: 'Format formulir tidak valid.' }, { status: 400 });
  }
  if (!isJsonObject(payload)) {
    return Response.json({ error: 'Data formulir tidak valid.' }, { status: 400 });
  }
  if (payload.website) {
    return Response.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }
  if (payload.action !== 'prepare' && payload.action !== 'submit') {
    return Response.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  let applicant: Applicant;
  let documents: Record<DocumentKey, DocumentDetails>;
  try {
    applicant = parseApplicant(payload);
    documents = {
      snspsDocument: parseDocument(payload, 'snspsDocument'),
      graduationProof: parseDocument(payload, 'graduationProof'),
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

  if (payload.action === 'prepare') {
    const applicationId = crypto.randomUUID();
    const fileNames: Record<DocumentKey, string> = {
      snspsDocument: 'snsps',
      graduationProof: 'bukti-kelulusan',
    };
    const uploads: { key: DocumentKey; path: string; token: string }[] = [];

    try {
      for (const key of DOCUMENT_KEYS) {
        const path = `${applicationId}/${fileNames[key]}.${documents[key].extension}`;
        const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUploadUrl(path);
        if (error) throw error;
        uploads.push({ key, path, token: data.token });
      }
    } catch (error) {
      console.error('Failed to create signed SPMB upload URLs:', error);
      return Response.json(
        { error: 'Tautan unggah berkas belum berhasil dibuat. Silakan coba lagi.' },
        { status: 502 },
      );
    }

    return Response.json({ ok: true, applicationId, uploads }, { status: 200 });
  }

  const applicationId = payload.applicationId;
  if (
    typeof applicationId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)
  ) {
    return Response.json({ error: 'ID pendaftaran tidak valid.' }, { status: 400 });
  }

  const fileNames: Record<DocumentKey, string> = {
    snspsDocument: 'snsps',
    graduationProof: 'bukti-kelulusan',
  };
  const filePaths = DOCUMENT_KEYS.map((key) => (
    `${applicationId}/${fileNames[key]}.${documents[key].extension}`
  ));

  const { data: uploadedFiles, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(applicationId, { limit: 10 });
  if (listError) {
    console.error('Failed to verify SPMB uploads:', listError);
    return Response.json({ error: 'Berkas belum dapat diverifikasi. Silakan coba lagi.' }, { status: 502 });
  }

  const uploadedNames = new Set((uploadedFiles || []).map((file) => file.name));
  const expectedNames = filePaths.map((path) => path.slice(applicationId.length + 1));
  if (expectedNames.some((name) => !uploadedNames.has(name))) {
    const existingPaths = filePaths.filter((path) => uploadedNames.has(path.slice(applicationId.length + 1)));
    if (existingPaths.length) {
      const { error: cleanupError } = await supabase.storage.from(BUCKET_NAME).remove(existingPaths);
      if (cleanupError) console.error('Failed to remove incomplete SPMB uploads:', cleanupError);
    }
    return Response.json({ error: 'Kedua berkas wajib berhasil diunggah sebelum pendaftaran dikirim.' }, { status: 400 });
  }

  const application = {
    id: applicationId,
    ...applicant,
    snsps_document_path: filePaths[0],
    graduation_proof_path: filePaths[1],
    status: 'Baru',
  };
  const { error: insertError } = await supabase.from('spmb_applications').insert(application);
  if (insertError) {
    const { error: cleanupError } = await supabase.storage.from(BUCKET_NAME).remove(filePaths);
    if (cleanupError) console.error('Failed to remove orphaned SPMB uploads:', cleanupError);
    console.error('Failed to save SPMB application:', insertError);
    return Response.json(
      { error: 'Pendaftaran belum berhasil disimpan. Silakan coba lagi.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true, applicationId }, { status: 201 });
}
