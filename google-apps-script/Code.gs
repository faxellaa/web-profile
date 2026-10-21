const SPREADSHEET_ID = '16k0WgG2xifOoIEKgJLj3FGsXxT9m7HI5BOh6Z2TTxJA';
const DRIVE_FOLDER_ID = '1BDk-O6fVATd_PGMk7GOq1fj9wm5rSMsH';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const HEADERS = [
  'Waktu Masuk',
  'Nama Pengirim',
  'Instansi / Organisasi',
  'Kontak',
  'Nomor Surat',
  'Tanggal Surat',
  'Perihal',
  'Ditujukan Kepada',
  'Ringkasan / Isi Surat',
  'Link Lampiran',
  'Status',
];

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents);
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('SUBMISSION_SECRET');
    if (!expectedSecret || data.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'Konfigurasi pengiriman tidak valid.' });
    }

    validateSubmission(data);
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      return jsonResponse({ ok: false, error: 'Sistem sedang sibuk. Silakan coba lagi.' });
    }

    try {
      const attachmentUrl = saveAttachment(data.attachment);
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
      if (!sheet) {
        throw new Error('Spreadsheet tidak memiliki sheet.');
      }

      const headerColumns = ensureHeaders(sheet);
      const row = new Array(headerColumns.length).fill('');
      const values = {
        'Waktu Masuk': new Date(),
        'Nama Pengirim': safeCell(data.senderName),
        'Instansi / Organisasi': safeCell(data.institution),
        'Kontak': safeCell(data.contact),
        'Nomor Surat': safeCell(data.letterNumber),
        'Tanggal Surat': safeCell(data.letterDate),
        'Perihal': safeCell(data.subject),
        'Ditujukan Kepada': safeCell(data.recipient),
        'Ringkasan / Isi Surat': safeCell(data.summary),
        'Link Lampiran': attachmentUrl,
        'Status': 'Baru',
      };

      Object.keys(values).forEach(function (header) {
        row[headerColumns.indexOf(header)] = values[header];
      });
      sheet.appendRow(row);
      return jsonResponse({ ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error('Incoming mail submission failed:', error);
    return jsonResponse({ ok: false, error: 'Surat belum dapat disimpan. Silakan coba lagi nanti.' });
  }
}

function validateSubmission(data) {
  const limits = {
    senderName: 120,
    institution: 160,
    contact: 160,
    letterNumber: 100,
    letterDate: 10,
    recipient: 120,
    subject: 200,
    summary: 5000,
  };
  Object.keys(limits).forEach(function (key) {
    if (typeof data[key] !== 'string' || data[key].length > limits[key]) {
      throw new Error('Invalid form field: ' + key);
    }
  });
  ['senderName', 'contact', 'subject', 'summary'].forEach(function (key) {
    if (!data[key].trim()) {
      throw new Error('Required form field is missing: ' + key);
    }
  });

  if (data.attachment) {
    if (
      typeof data.attachment.data !== 'string' ||
      typeof data.attachment.fileName !== 'string' ||
      typeof data.attachment.mimeType !== 'string' ||
      !['application/pdf', 'image/jpeg', 'image/png'].includes(data.attachment.mimeType)
    ) {
      throw new Error('Invalid attachment.');
    }
    if (Utilities.base64Decode(data.attachment.data).length > MAX_FILE_BYTES) {
      throw new Error('Attachment exceeds the allowed size.');
    }
  }
}

function saveAttachment(attachment) {
  if (!attachment) {
    return '';
  }

  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const safeName = attachment.fileName.replace(/[^\w.-]+/g, '_').slice(0, 100) || 'lampiran';
  const blob = Utilities.newBlob(
    Utilities.base64Decode(attachment.data),
    attachment.mimeType,
    new Date().toISOString().replace(/[:.]/g, '-') + '_' + safeName,
  );
  return folder.createFile(blob).getUrl();
}

function ensureHeaders(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  let headers = existing.map(function (value) {
    return String(value).trim();
  });

  if (headers.every(function (value) { return !value; })) {
    headers = HEADERS.slice();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return headers;
  }

  HEADERS.forEach(function (header) {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
      sheet.getRange(1, headers.length).setValue(header);
    }
  });
  return headers;
}

function safeCell(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
