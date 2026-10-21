const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 100_000;
const ALLOWED_FILE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

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

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_SIZE) {
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

  let payload: Record<string, string | { fileName: string; mimeType: string; data: string }>;
  try {
    payload = {
      senderName: textField(formData, 'senderName', 120, true),
      institution: textField(formData, 'institution', 160),
      contact: textField(formData, 'contact', 160, true),
      letterNumber: textField(formData, 'letterNumber', 100),
      letterDate: textField(formData, 'letterDate', 10),
      recipient: textField(formData, 'recipient', 120),
      subject: textField(formData, 'subject', 200, true),
      summary: textField(formData, 'summary', 5000, true),
    };

    const attachment = formData.get('attachment');
    if (attachment !== null && !(attachment instanceof File)) {
      throw new Error('Lampiran tidak valid.');
    }
    if (attachment instanceof File && attachment.size > 0) {
      if (attachment.size > MAX_FILE_SIZE) {
        return Response.json({ error: 'Ukuran lampiran maksimal 5 MB.' }, { status: 413 });
      }
      if (!ALLOWED_FILE_TYPES.has(attachment.type)) {
        return Response.json({ error: 'Lampiran hanya boleh berupa PDF, JPG, atau PNG.' }, { status: 400 });
      }

      payload.attachment = {
        fileName: attachment.name,
        mimeType: attachment.type,
        data: Buffer.from(await attachment.arrayBuffer()).toString('base64'),
      };
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Data formulir tidak valid.' },
      { status: 400 },
    );
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const sharedSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!scriptUrl || !sharedSecret) {
    return Response.json(
      { error: 'Pengiriman surat belum dikonfigurasi. Silakan hubungi administrator sekolah.' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, secret: sharedSecret }),
      cache: 'no-store',
      redirect: 'follow',
    });
    const result = (await response.json()) as { ok?: boolean; error?: string };

    if (!response.ok || !result.ok) {
      console.error('Google Apps Script rejected incoming mail:', result.error || response.statusText);
      return Response.json(
        { error: result.error || 'Surat belum berhasil disimpan. Silakan coba lagi.' },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to forward incoming mail to Google Apps Script:', error);
    return Response.json(
      { error: 'Layanan penyimpanan surat sedang tidak tersedia. Silakan coba lagi nanti.' },
      { status: 502 },
    );
  }
}
