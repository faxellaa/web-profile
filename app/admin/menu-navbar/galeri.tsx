'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { uploadSchoolImage } from '@/lib/storage';
import { getYouTubeVideoId } from '@/lib/youtube';
import AdminFormModal from '../components/AdminFormModal';
import AdminNavbar from '../components/navbar';

type GalleryItem = {
  id: string;
  media_type: 'photo' | 'video';
  title: string;
  media_url: string;
  storage_path: string | null;
  created_at: string;
};

export default function AdminGalleryPage() {
  const router = useRouter();
  const { t } = useLang();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('school_gallery_items')
      .select('id,media_type,title,media_url,storage_path,created_at')
      .order('media_type')
      .order('sort_order')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load school gallery items:', error);
      setMessage(t('Konten galeri belum dapat dimuat.', 'Gallery content could not be loaded.'));
      return false;
    }
    setItems(data || []);
    return true;
  }, [t]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Failed to read gallery admin session:', error);
        if (active) setMessage(t('Sesi admin tidak dapat diverifikasi.', 'The admin session could not be verified.'));
      } else if (!sessionData.session) {
        router.replace('/admin/login');
      } else if (active) {
        await load();
      }
      if (active) setLoading(false);
    };
    void initialize();
    return () => { active = false; };
  }, [load, router, t]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setMessage('');
    let uploadedPath: string | null = null;
    let mediaUrl = videoUrl.trim();

    try {
      if (!title.trim()) throw new Error(t('Judul/keterangan wajib diisi.', 'A title or caption is required.'));
      if (mediaType === 'photo') {
        if (!file) throw new Error(t('Pilih foto terlebih dahulu.', 'Choose a photo first.'));
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(t('Foto harus berupa JPG, PNG, atau WebP.', 'Photos must be JPG, PNG, or WebP.'));
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(t('Ukuran foto maksimal 10 MB.', 'Photos must be 10 MB or smaller.'));
        }
        const uploaded = await uploadSchoolImage(file, 'galeri');
        uploadedPath = uploaded.filePath;
        mediaUrl = uploaded.publicUrl;
      } else if (!mediaUrl || !getYouTubeVideoId(mediaUrl)) {
        throw new Error(t('Masukkan tautan video YouTube yang valid.', 'Enter a valid YouTube video link.'));
      }

      const result = await supabase.from('school_gallery_items').insert({
        media_type: mediaType,
        title: title.trim(),
        media_url: mediaUrl,
        storage_path: uploadedPath,
      });
      if (result.error) {
        if (uploadedPath) {
          const { error: cleanupError } = await supabase.storage.from('school-media').remove([uploadedPath]);
          if (cleanupError) console.error('Failed to clean up an unlisted gallery photo:', cleanupError);
        }
        throw result.error;
      }

      setTitle('');
      setVideoUrl('');
      setFile(null);
      form.reset();
      const refreshed = await load();
      setMessage(refreshed
        ? t('Konten galeri berhasil ditambahkan.', 'Gallery item added successfully.')
        : t('Konten galeri berhasil ditambahkan, tetapi daftar belum dapat diperbarui.', 'Gallery item was added, but the list could not be refreshed.'));
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to save school gallery item:', error);
      setMessage(error instanceof Error ? error.message : t('Konten galeri belum berhasil disimpan.', 'The gallery item could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: GalleryItem) => {
    if (!window.confirm(t(`Hapus “${item.title}” dari galeri?`, `Remove “${item.title}” from the gallery?`))) return;
    setBusyId(item.id);
    setMessage('');

    const { error } = await supabase.from('school_gallery_items').delete().eq('id', item.id);
    if (error) {
      console.error('Failed to remove school gallery item:', error);
      setMessage(t('Konten galeri belum berhasil dihapus.', 'The gallery item could not be deleted.'));
      setBusyId('');
      return;
    }

    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    if (item.storage_path) {
      const { error: storageError } = await supabase.storage.from('school-media').remove([item.storage_path]);
      if (storageError) {
        console.error('Gallery record deleted but its photo could not be removed from storage:', storageError);
        setMessage(t('Konten sudah dihapus, tetapi file foto belum berhasil dibersihkan dari penyimpanan.', 'The gallery item was removed, but its image file could not be deleted from storage.'));
      }
    }
    setBusyId('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Dokumentasi Sekolah', 'School Documentation')}</p>
            <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Kelola Galeri', 'Manage Gallery')}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('Tambahkan foto dan video YouTube yang akan tampil pada halaman galeri publik.', 'Add photos and YouTube videos to the public gallery pages.')}</p>
          </div>
          <button type="button" onClick={() => { setMessage(''); setFormOpen(true); }} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800">
            {t('Tambah konten', 'Add content')}
          </button>
        </header>

        {message && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">{message}</p>}

        {loading ? (
          <div className="admin-loading" role="status"><span>{t('Memuat galeri…', 'Loading gallery…')}</span></div>
        ) : (
          <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">{t('Konten yang dikelola', 'Managed content')} ({items.length})</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('Foto bawaan website tetap tampil. Item di bawah adalah foto/video yang ditambahkan dari admin.', 'Existing site photos remain visible. Items below are photos/videos added through admin.')}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <article key={item.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10">
                  {item.media_type === 'photo' && <img src={item.media_url} alt="" className="aspect-video w-full bg-slate-100 object-cover dark:bg-slate-900" />}
                  <div className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-300">{item.media_type === 'photo' ? t('Foto', 'Photo') : t('Video', 'Video')}</p>
                      <h3 className="mt-1 break-words text-sm font-bold">{item.title}</h3>
                      {item.media_type === 'video' && <a href={item.media_url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-slate-500 underline dark:text-slate-400">{item.media_url}</a>}
                    </div>
                    <button type="button" disabled={busyId === item.id} onClick={() => void remove(item)} className="min-h-10 shrink-0 rounded-lg px-3 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-400/10">
                      {t('Hapus', 'Delete')}
                    </button>
                  </div>
                </article>
              ))}
              {items.length === 0 && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 sm:col-span-2">{t('Belum ada konten tambahan.', 'No additional content yet.')}</p>}
            </div>
          </section>
        )}

        <AdminFormModal open={formOpen} title={t('Tambah konten', 'Add content')} onClose={() => setFormOpen(false)}>
            <form onSubmit={save} className="space-y-4">
              {message && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-300">{message}</p>}
              <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                {t('Jenis konten', 'Content type')}
                <select value={mediaType} onChange={(event) => setMediaType(event.target.value as 'photo' | 'video')} className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-sm text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-white">
                  <option value="photo">{t('Foto', 'Photo')}</option>
                  <option value="video">{t('Video YouTube', 'YouTube video')}</option>
                </select>
              </label>
              <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                {t('Judul / keterangan', 'Title / caption')}
                <input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm" />
              </label>
              {mediaType === 'photo' ? (
                <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {t('Pilih foto', 'Choose a photo')}
                  <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="min-h-11 w-full rounded-xl border border-slate-300/80 bg-white p-2 text-sm text-slate-700 dark:border-white/15 dark:bg-slate-950 dark:text-slate-200" />
                  <span className="font-normal leading-5 text-slate-500 dark:text-slate-400">{t('JPG, PNG, atau WebP · maksimal 10 MB.', 'JPG, PNG, or WebP · up to 10 MB.')}</span>
                </label>
              ) : (
                <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {t('Tautan video YouTube', 'YouTube video link')}
                  <input required type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/…" className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm" />
                </label>
              )}
              <button type="submit" disabled={saving} className="min-h-11 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">
                {saving ? t('Menyimpan…', 'Saving…') : t('Tambahkan ke galeri', 'Add to gallery')}
              </button>
            </form>
        </AdminFormModal>
      </div>
    </div>
  );
}
