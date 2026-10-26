import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 100_000;
const STORAGE_TIMEOUT_MS = 30_000;
const ALLOWED_FILE_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['application/msword', 'doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const BUCKET_NAME = 'incoming-mail-attachments';

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

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
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
        const timeoutSignal = AbortSignal.timeout(STORAGE_TIMEOUT_MS);
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
    return Response.json({ error: 'Ukuran permintaan terlalu besar. Batas lampiran 5 MB.' }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error('Invalid incoming mail form data:', error);
    return Response.json({ error: 'Format formulir tidak valid.' }, { status: 400 });
  }

  if (formData.get('website')) {
    return Response.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  let fields: {
    sender_name: string;
    institution: string;
    contact: string;
    letter_number: string;
    letter_date: string;
    recipient: string;
    subject: string;
    summary: string;
  };
  let attachment: File;

  try {
    const letterDate = textField(formData, 'letterDate', 10, true);
    if (!isValidDate(letterDate)) {
      throw new Error('Tanggal surat tidak valid.');
    }

    fields = {
      sender_name: textField(formData, 'senderName', 120, true),
      institution: textField(formData, 'institution', 160, true),
      contact: textField(formData, 'contact', 160, true),
      letter_number: textField(formData, 'letterNumber', 100, true),
      letter_date: letterDate,
      recipient: textField(formData, 'recipient', 120, true),
      subject: textField(formData, 'subject', 200, true),
      summary: textField(formData, 'summary', 5000, true),
    };

    const attachmentField = formData.get('attachment');
    if (!(attachmentField instanceof File) || attachmentField.size === 0) {
      throw new Error('Lampiran wajib diunggah.');
    }
    attachment = attachmentField;

    if (attachment.size > MAX_FILE_SIZE) {
      throw new Error('Ukuran lampiran maksimal 5 MB.');
    }
    if (!ALLOWED_FILE_TYPES.has(attachment.type)) {
      throw new Error('Lampiran harus berupa foto, PDF, atau Word (.doc/.docx).');
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Data formulir tidak valid.' },
      { status: 400 },
    );
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return Response.json(
      { error: 'Penyimpanan surat masuk belum dikonfigurasi. Silakan hubungi administrator sekolah.' },
      { status: 503 },
    );
  }

  const id = crypto.randomUUID();
  const extension = ALLOWED_FILE_TYPES.get(attachment.type);
  if (!extension) {
    return Response.json({ error: 'Jenis lampiran tidak didukung.' }, { status: 400 });
  }

  const attachmentPath = `${id}/lampiran.${extension}`;
  try {
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(
      attachmentPath,
      Buffer.from(await attachment.arrayBuffer()),
      {
        contentType: attachment.type,
        cacheControl: '3600',
        upsert: false,
      },
    );
    if (uploadError) throw uploadError;
  } catch (error) {
    console.error('Failed to upload incoming mail attachment:', error);
    return Response.json({ error: 'Lampiran belum berhasil disimpan. Silakan coba lagi.' }, { status: 502 });
  }

  try {
    const { error: insertError } = await supabase.from('incoming_letters').insert({
      id,
      ...fields,
      attachment_path: attachmentPath,
      attachment_name: attachment.name.slice(0, 255),
      status: 'Baru',
    });
    if (insertError) throw insertError;
  } catch (error) {
    try {
      const { error: cleanupError } = await supabase.storage.from(BUCKET_NAME).remove([attachmentPath]);
      if (cleanupError) console.error('Failed to remove orphaned incoming mail attachment:', cleanupError);
    } catch (cleanupError) {
      console.error('Failed to remove orphaned incoming mail attachment:', cleanupError);
    }
    console.error('Failed to save incoming mail:', error);
    return Response.json({ error: 'Surat belum berhasil disimpan. Silakan coba lagi.' }, { status: 502 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
