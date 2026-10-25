import { supabase } from './supabase';

const BUCKET_NAME = 'school-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Mengunggah file gambar ke Supabase Storage
 */
export async function uploadSchoolImage(file: File, folder: string = 'general') {
  try {
    const fileExt = IMAGE_EXTENSIONS[file.type];
    if (!fileExt) {
      throw new Error('Foto harus berformat JPG, PNG, atau WebP.');
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      throw new Error('Ukuran foto harus lebih dari 0 dan maksimal 10 MB.');
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // 2. Upload file ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 3. Dapatkan URL publik permanen
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      filePath,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    console.error('Error uploading image:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export function getSchoolImagePathFromUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  try {
    const bucketUrl = new URL(supabase.storage.from(BUCKET_NAME).getPublicUrl('').data.publicUrl);
    const image = new URL(imageUrl);
    const bucketPath = `${bucketUrl.pathname.replace(/\/+$/, '')}/`;

    if (image.origin !== bucketUrl.origin || !image.pathname.startsWith(bucketPath)) return null;
    const path = decodeURIComponent(image.pathname.slice(bucketPath.length));
    if (!path || path.split('/').some((part) => !part || part === '.' || part === '..')) return null;
    return path;
  } catch {
    return null;
  }
}

/**
 * Menghapus file fisik gambar dari Supabase Storage
 */
export async function deleteSchoolImage(filePath: string) {
  if (!filePath) return true;
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Gagal menghapus file storage:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleteSchoolImage:', err);
    return false;
  }
}