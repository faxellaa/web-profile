'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ImageOff } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { deleteSchoolImage, getSchoolImagePathFromUrl, uploadSchoolImage } from '@/lib/storage';
import AdminFormModal from '../components/AdminFormModal';
import AdminImageField from '../components/AdminImageField';
import AdminNavbar from '../components/navbar';

type Achievement = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url?: string;
  image_path?: string | null;
  created_at?: string;
};

const ACHIEVEMENT_CATEGORY = 'Prestasi Siswa';

export default function AdminPrestasiPage() {
  const router = useRouter();
  const { t } = useLang();
  const [items, setItems] = useState<Achievement[]>([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category', ACHIEVEMENT_CATEGORY)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load school achievements:', error);
      setMessage(t('Prestasi gagal dimuat.', 'Achievements could not be loaded.'));
      return false;
    }

    setItems(data || []);
    setMessage('');
    return true;
  }, [t]);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Failed to verify admin session:', error);
        setMessage(t('Sesi admin tidak dapat diverifikasi.', 'The admin session could not be verified.'));
        setLoading(false);
        return;
      }
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      await load();
      setLoading(false);
    };

    void checkSession();
  }, [load, router, t]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    let uploadedPath: string | null = null;

    try {
      let imageUrl: string | null = removeImage ? null : editing?.image_url ?? null;
      let imagePath: string | null = removeImage ? null : editing?.image_path || getSchoolImagePathFromUrl(editing?.image_url);
      if (file) {
        const uploaded = await uploadSchoolImage(file, 'prestasi');
        uploadedPath = uploaded.filePath;
        imageUrl = uploaded.publicUrl;
        imagePath = uploaded.filePath;
      }

      const payload = {
        ...form,
        category: ACHIEVEMENT_CATEGORY,
        image_url: imageUrl,
        image_path: imagePath,
      };
      const result = editing
        ? await supabase.from('articles').update(payload).eq('id', editing.id)
        : await supabase.from('articles').insert({
          ...payload,
          date_label: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        });
      if (result.error) throw result.error;

      const oldImagePath = editing?.image_path || getSchoolImagePathFromUrl(editing?.image_url);
      const cleanupSucceeded = !oldImagePath || (!file && !removeImage) || await deleteSchoolImage(oldImagePath);
      setForm({ title: '', description: '' });
      setFile(null);
      setEditing(null);
      setRemoveImage(false);
      const refreshed = await load();
      const savedMessage = refreshed
        ? editing
          ? t('Prestasi berhasil diperbarui.', 'Achievement updated successfully.')
          : t('Prestasi berhasil ditambahkan.', 'Achievement added successfully.')
        : editing
          ? t('Prestasi berhasil diperbarui, tetapi daftar belum dapat diperbarui.', 'Achievement was updated, but the list could not be refreshed.')
          : t('Prestasi berhasil ditambahkan, tetapi daftar belum dapat diperbarui.', 'Achievement was added, but the list could not be refreshed.');
      setMessage(cleanupSucceeded
        ? savedMessage
        : `${savedMessage} ${t('File gambar lama belum berhasil dihapus dari penyimpanan.', 'The old image file could not be deleted from storage.')}`);
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to save school achievement:', error);
      if (uploadedPath) await deleteSchoolImage(uploadedPath);
      setMessage(error instanceof Error ? error.message : t('Prestasi gagal disimpan.', 'Achievement could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Achievement) => {
    if (!window.confirm(t(`Hapus prestasi "${item.title}"?`, `Delete achievement "${item.title}"?`))) return;

    const { error } = await supabase.from('articles').delete().eq('id', item.id);
    if (error) {
      console.error('Failed to delete school achievement:', error);
      setMessage(error.message);
      return;
    }

    const imagePath = item.image_path || getSchoolImagePathFromUrl(item.image_url);
    const imageCleanupSucceeded = !imagePath || await deleteSchoolImage(imagePath);
    const refreshed = await load();
    const deletedMessage = refreshed
      ? t('Prestasi berhasil dihapus.', 'Achievement deleted successfully.')
      : t('Prestasi berhasil dihapus, tetapi daftar belum dapat diperbarui.', 'Achievement was deleted, but the list could not be refreshed.');
    setMessage(imageCleanupSucceeded
      ? deletedMessage
      : `${deletedMessage} ${t('File gambar belum berhasil dihapus dari penyimpanan.', 'The image file could not be deleted from storage.')}`);
  };

  const openAddForm = () => {
    setMessage('');
    setEditing(null);
    setForm({ title: '', description: '' });
    setFile(null);
    setRemoveImage(false);
    setFormOpen(true);
  };

  const openEditForm = (item: Achievement) => {
    setMessage('');
    setEditing(item);
    setForm({ title: item.title, description: item.description });
    setFile(null);
    setRemoveImage(false);
    setFormOpen(true);
  };

  if (loading) {
    return <div className="admin-loading" role="status"><span>{t('Memuat prestasi...', 'Loading achievements...')}</span></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Konten Sekolah', 'School Content')}</p>
            <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Prestasi Siswa', 'Student Achievements')}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Kelola prestasi dan capaian siswa yang ditampilkan di halaman Prestasi.', 'Manage student achievements displayed on the Achievements page.')}</p>
          </div>
          <button type="button" onClick={openAddForm} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800">
            {t('Tambah Prestasi', 'Add Achievement')}
          </button>
        </header>

        {message && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-sky-300">{message}</p>}

        <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
          <h2 className="text-lg font-black">{t('Konten yang dikelola', 'Managed achievements')} ({items.length})</h2>
          <div className="mt-5 divide-y divide-slate-200/70 dark:divide-white/10">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 p-4 dark:border-white/10 sm:flex-row">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="h-32 w-full shrink-0 rounded-xl bg-blue-50 object-cover dark:bg-slate-800 sm:w-48" />
                ) : (
                  <div role="img" aria-label={t('Gambar belum tersedia', 'Image not available')} className="flex h-32 w-full shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-xs font-medium text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-500 sm:w-48">
                    <ImageOff aria-hidden="true" className="h-6 w-6" />
                    <span>{t('Gambar belum tersedia', 'Image not available')}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                <div className="flex self-start gap-1">
                  <button type="button" onClick={() => openEditForm(item)} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20">{t('Edit', 'Edit')}</button>
                  <button type="button" onClick={() => void remove(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20">{t('Hapus', 'Delete')}</button>
                </div>
              </article>
            ))}
            {items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t('Belum ada prestasi.', 'No achievements yet.')}</p>}
          </div>
        </section>

        <AdminFormModal open={formOpen} title={editing ? t('Edit Prestasi', 'Edit Achievement') : t('Tambah Prestasi', 'Add Achievement')} onClose={() => setFormOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{message}</p>}
            <input
              required
              placeholder={t('Judul prestasi', 'Achievement title')}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="w-full rounded-xl border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-900"
            />
            <textarea
              required
              rows={5}
              placeholder={t('Deskripsi prestasi', 'Achievement description')}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full rounded-xl border bg-slate-50 p-3 text-sm leading-relaxed dark:border-white/10 dark:bg-slate-900"
            />
            <AdminImageField
              label={t('Foto prestasi', 'Achievement image')}
              imageUrl={editing?.image_url}
              file={file}
              removeImage={removeImage}
              onFileChange={(selectedFile) => { setFile(selectedFile); if (selectedFile) setRemoveImage(false); }}
              onRemoveImage={() => { setRemoveImage(true); setFile(null); }}
              onRestoreImage={() => setRemoveImage(false)}
              unavailableLabel={t('Gambar belum tersedia', 'Image not available')}
              chooseImageLabel={t('Pilih gambar untuk mengganti atau menambahkan', 'Choose an image to replace or add')}
              removeImageLabel={t('Hapus gambar', 'Remove image')}
              restoreImageLabel={t('Batalkan hapus gambar', 'Undo image removal')}
            />
            <button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? t('Menyimpan...', 'Saving...') : editing ? t('Simpan Perubahan', 'Save Changes') : t('Tambah Prestasi', 'Add Achievement')}
            </button>
          </form>
        </AdminFormModal>
      </div>
    </div>
  );
}
