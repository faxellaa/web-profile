'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { deleteSchoolImage, uploadSchoolImage } from '@/lib/storage';
import { getYouTubeVideoId } from '@/lib/youtube';
import AdminFormModal from '../components/AdminFormModal';
import AdminImageField from '../components/AdminImageField';
import AdminNavbar from '../components/navbar';

type GalleryItem = {
  id: string;
  media_type: 'photo' | 'video';
  title: string;
  media_url: string;
  storage_path: string | null;
  created_at: string;
};

type MediaType = GalleryItem['media_type'];

export default function AdminGalleryPage({ mediaType }: { mediaType: MediaType }) {
  const router = useRouter();
  const { t } = useLang();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
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
      .eq('media_type', mediaType)
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
  }, [mediaType, t]);

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
    let mediaUrl = editing?.media_type === 'photo' ? editing.media_url : videoUrl.trim();
    let storagePath = editing?.media_type === 'photo' ? editing.storage_path : null;

    try {
      if (!title.trim()) throw new Error(t('Judul/keterangan wajib diisi.', 'A title or caption is required.'));
      if (mediaType === 'photo') {
        if (!file && !editing) throw new Error(t('Pilih foto terlebih dahulu.', 'Choose a photo first.'));
        if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(t('Foto harus berupa JPG, PNG, atau WebP.', 'Photos must be JPG, PNG, or WebP.'));
        }
        if (file && file.size > 10 * 1024 * 1024) {
          throw new Error(t('Ukuran foto maksimal 10 MB.', 'Photos must be 10 MB or smaller.'));
        }
        if (file) {
          const uploaded = await uploadSchoolImage(file, 'galeri');
          uploadedPath = uploaded.filePath;
          storagePath = uploaded.filePath;
          mediaUrl = uploaded.publicUrl;
        }
      } else if (!mediaUrl || !getYouTubeVideoId(mediaUrl)) {
        throw new Error(t('Masukkan tautan video YouTube yang valid.', 'Enter a valid YouTube video link.'));
      }

      const payload = {
        media_type: mediaType,
        title: title.trim(),
        media_url: mediaUrl,
        storage_path: storagePath,
      };
      const result = editing
        ? await supabase.from('school_gallery_items').update(payload).eq('id', editing.id)
        : await supabase.from('school_gallery_items').insert(payload);
      if (result.error) throw result.error;

      const cleanupSucceeded = !editing?.storage_path || !file || await deleteSchoolImage(editing.storage_path);
      setTitle('');
      setVideoUrl('');
      setFile(null);
      setEditing(null);
      form.reset();
      const refreshed = await load();
      const savedMessage = refreshed
        ? editing
          ? t('Konten galeri berhasil diperbarui.', 'Gallery item updated successfully.')
          : t('Konten galeri berhasil ditambahkan.', 'Gallery item added successfully.')
        : editing
          ? t('Konten galeri berhasil diperbarui, tetapi daftar belum dapat diperbarui.', 'Gallery item was updated, but the list could not be refreshed.')
          : t('Konten galeri berhasil ditambahkan, tetapi daftar belum dapat diperbarui.', 'Gallery item was added, but the list could not be refreshed.');
      setMessage(cleanupSucceeded
        ? savedMessage
        : `${savedMessage} ${t('Foto lama belum berhasil dihapus dari penyimpanan.', 'The old photo could not be deleted from storage.')}`);
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to save school gallery item:', error);
      if (uploadedPath) await deleteSchoolImage(uploadedPath);
      setMessage(error instanceof Error ? error.message : t('Konten galeri belum berhasil disimpan.', 'The gallery item could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: GalleryItem) => {
    const confirmation = item.media_type === 'photo'
      ? t(`Hapus foto “${item.title}” dari galeri?`, `Remove photo “${item.title}” from the gallery?`)
      : t(`Hapus video YouTube “${item.title}” dari galeri?`, `Remove YouTube video “${item.title}” from the gallery?`);
    if (!window.confirm(confirmation)) return;
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
    const cleanupSucceeded = !item.storage_path || await deleteSchoolImage(item.storage_path);
    if (!cleanupSucceeded) {
      setMessage(t('Konten sudah dihapus, tetapi file foto belum berhasil dibersihkan dari penyimpanan.', 'The gallery item was removed, but its image file could not be deleted from storage.'));
    }
    setBusyId('');
  };

  const openAddForm = () => {
    setMessage('');
    setEditing(null);
    setTitle('');
    setVideoUrl('');
    setFile(null);
    setFormOpen(true);
  };

  const openEditForm = (item: GalleryItem) => {
    setMessage('');
    setEditing(item);
    setTitle(item.title);
    setVideoUrl(item.media_type === 'video' ? item.media_url : '');
    setFile(null);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Dokumentasi Sekolah', 'School Documentation')}</p>
            <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{mediaType === 'photo' ? t('Kelola Galeri Foto', 'Manage Photo Gallery') : t('Kelola Video YouTube', 'Manage YouTube Videos')}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{mediaType === 'photo'
              ? t('Kelola foto kegiatan sekolah yang tampil di galeri foto.', 'Manage school photos shown in the photo gallery.')
              : t('Kelola tautan video YouTube. Thumbnail diambil otomatis dari YouTube.', 'Manage YouTube video links. Thumbnails are loaded automatically from YouTube.')}</p>
          </div>
          <button type="button" onClick={openAddForm} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800">
            {mediaType === 'photo' ? t('Tambah Foto', 'Add Photo') : t('Tambah Video', 'Add Video')}
          </button>
        </header>

        {message && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">{message}</p>}

        {loading ? (
          <div className="admin-loading" role="status"><span>{t('Memuat galeri…', 'Loading gallery…')}</span></div>
        ) : (
          <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7">
            <h2 className="text-lg font-black text-slate-950 dark:text-white">{mediaType === 'photo' ? t('Foto yang dikelola', 'Managed photos') : t('Video yang dikelola', 'Managed videos')} ({items.length})</h2>
            {mediaType === 'video' && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{t('Cukup tempel tautan YouTube saat menambah atau mengedit video. Thumbnail akan mengikuti video secara otomatis.', 'Paste a YouTube link when adding or editing a video. Its thumbnail will update automatically.')}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const videoId = item.media_type === 'video' ? getYouTubeVideoId(item.media_url) : null;
                return (
                <article key={item.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10">
                  {item.media_type === 'photo' ? (
                    <img src={item.media_url} alt={item.title} className="aspect-video w-full bg-slate-100 object-cover dark:bg-slate-900" />
                  ) : videoId ? (
                    <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" className="aspect-video w-full bg-slate-100 object-cover dark:bg-slate-900" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-100 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">{t('Thumbnail tidak tersedia', 'Thumbnail unavailable')}</div>
                  )}
                  <div className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-300">{mediaType === 'photo' ? t('Foto', 'Photo') : t('Video YouTube', 'YouTube video')}</p>
                      <h3 className="mt-1 break-words text-sm font-bold">{item.title}</h3>
                      {item.media_type === 'video' && <a href={item.media_url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-slate-500 underline dark:text-slate-400">{item.media_url}</a>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" disabled={busyId === item.id} onClick={() => openEditForm(item)} className="min-h-10 rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20">{t('Edit', 'Edit')}</button>
                      <button type="button" disabled={busyId === item.id} onClick={() => void remove(item)} className="min-h-10 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20">
                        {mediaType === 'photo' ? t('Hapus Foto', 'Delete Photo') : t('Hapus Video', 'Delete Video')}
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
              {items.length === 0 && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 sm:col-span-2">{mediaType === 'photo' ? t('Belum ada foto.', 'No photos yet.') : t('Belum ada video.', 'No videos yet.')}</p>}
            </div>
          </section>
        )}

        <AdminFormModal open={formOpen} title={editing
          ? mediaType === 'photo' ? t('Edit Foto', 'Edit Photo') : t('Edit Video YouTube', 'Edit YouTube Video')
          : mediaType === 'photo' ? t('Tambah Foto', 'Add Photo') : t('Tambah Video YouTube', 'Add YouTube Video')} onClose={() => setFormOpen(false)}>
            <form onSubmit={save} className="space-y-4">
              {message && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-300">{message}</p>}
              <p className="w-fit rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
                {mediaType === 'photo' ? t('Jenis: Foto', 'Type: Photo') : t('Jenis: Video YouTube', 'Type: YouTube video')}
              </p>
              <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                {t('Judul / keterangan', 'Title / caption')}
                <input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm" />
              </label>
              {mediaType === 'photo' ? (
                <div className="space-y-2">
                  <AdminImageField
                    label={t('Foto galeri', 'Gallery photo')}
                    imageUrl={editing?.media_type === 'photo' ? editing.media_url : null}
                    file={file}
                    removeImage={false}
                    allowRemoveImage={false}
                    onFileChange={setFile}
                    onRemoveImage={() => setFile(null)}
                    onRestoreImage={() => {}}
                    unavailableLabel={t('Pilih foto untuk ditambahkan', 'Choose a photo to add')}
                    chooseImageLabel={editing ? t('Pilih foto pengganti (opsional)', 'Choose a replacement photo (optional)') : t('Pilih foto', 'Choose a photo')}
                    removeImageLabel={t('Hapus pilihan', 'Clear selection')}
                    restoreImageLabel={t('Batalkan', 'Cancel')}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('JPG, PNG, atau WebP · maksimal 10 MB.', 'JPG, PNG, or WebP · up to 10 MB.')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="grid gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('Tautan video YouTube', 'YouTube video link')}
                    <input required type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/…" className="min-h-11 rounded-xl border border-slate-300/80 bg-white px-3 text-base font-normal text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:text-sm" />
                  </label>
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{t('Cukup tempel tautan YouTube. Thumbnail akan diambil otomatis dari YouTube.', 'Paste the YouTube link. Its thumbnail will be loaded automatically from YouTube.')}</p>
                  {getYouTubeVideoId(videoUrl) && <img src={`https://i.ytimg.com/vi/${getYouTubeVideoId(videoUrl)}/hqdefault.jpg`} alt="" className="aspect-video w-full rounded-xl bg-slate-100 object-cover dark:bg-slate-900" />}
                </div>
              )}
              <button type="submit" disabled={saving} className="min-h-11 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">
                {saving ? t('Menyimpan…', 'Saving…') : editing ? t('Simpan perubahan', 'Save changes') : t('Tambahkan ke galeri', 'Add to gallery')}
              </button>
            </form>
        </AdminFormModal>
      </div>
    </div>
  );
}
