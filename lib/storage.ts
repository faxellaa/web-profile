import { supabase } from './supabase';

const BUCKET_NAME = 'school-media';

/**
 * Mengunggah file gambar ke Supabase Storage
 */
export async function uploadSchoolImage(file: File, folder: string = 'general') {
  try {
    // 1. Dapatkan ekstensi file dan buat nama unik dengan UUID
    const fileExt = file.name.split('.').pop();
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

/**
 * Menghapus file fisik gambar dari Supabase Storage
 */
export async function deleteSchoolImage(filePath: string) {
  if (!filePath) return;
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Gagal menghapus file storage:', error.message);
    }
  } catch (err) {
    console.error('Error deleteSchoolImage:', err);
  }
}