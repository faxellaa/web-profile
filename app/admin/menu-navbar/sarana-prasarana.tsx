'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { deleteSchoolImage, getSchoolImagePathFromUrl, uploadSchoolImage } from '@/lib/storage';
import AdminFormModal from '../components/AdminFormModal';
import AdminImageField from '../components/AdminImageField';
import AdminNavbar from '../components/navbar';

type Facility = { id: string; name: string; description: string; image_url?: string; image_path?: string };
const emptyForm = { name: '', description: '' };

export default function AdminSaranaPage() {
  const router = useRouter();
  const { t } = useLang();
  const [items, setItems] = useState<Facility[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('facilities').select('*');
    if (error) {
      console.error('Failed to load facilities:', error);
      setMessage(t('Data sarana gagal dimuat.', 'Facility data could not be loaded.'));
      return false;
    }
    setItems(data || []);
    setMessage('');
    return true;
  }, [t]);

  useEffect(() => {
    const initialize = async () => {
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
    void initialize();
  }, [load, router, t]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage('');
    let uploadedPath: string | null = null;

    try {
      let imageUrl = removeImage ? null : editing?.image_url || null;
      let imagePath = removeImage
        ? null
        : editing?.image_path || getSchoolImagePathFromUrl(editing?.image_url);
      if (file) {
        const uploaded = await uploadSchoolImage(file, 'fasilitas');
        uploadedPath = uploaded.filePath;
        imageUrl = uploaded.publicUrl;
        imagePath = uploaded.filePath;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: imageUrl,
        image_path: imagePath,
      };
      const result = editing
        ? await supabase.from('facilities').update(payload).eq('id', editing.id)
        : await supabase.from('facilities').insert(payload);
      if (result.error) throw result.error;

      const oldImagePath = editing?.image_path || getSchoolImagePathFromUrl(editing?.image_url);
      const cleanupSucceeded = !oldImagePath || (!file && !removeImage) || await deleteSchoolImage(oldImagePath);

      formElement.reset();
      setForm(emptyForm);
      setFile(null);
      setRemoveImage(false);
      setEditing(null);
      const refreshed = await load();
      const savedMessage = refreshed
        ? t('Sarana berhasil disimpan.', 'Facility saved successfully.')
        : t('Sarana berhasil disimpan, tetapi daftar belum dapat diperbarui.', 'Facility was saved, but the list could not be refreshed.');
      setMessage(cleanupSucceeded
        ? savedMessage
        : `${savedMessage} ${t('File gambar lama belum berhasil dihapus dari penyimpanan.', 'The old image file could not be deleted from storage.')}`);
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to save facility:', error);
      if (uploadedPath) await deleteSchoolImage(uploadedPath);
      setMessage(error instanceof Error ? error.message : t('Sarana gagal disimpan.', 'Facility could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Facility) => {
    if (!window.confirm(t(`Hapus ${item.name}?`, `Delete ${item.name}?`))) return;
    const { error } = await supabase.from('facilities').delete().eq('id', item.id);
    if (error) {
      console.error('Failed to delete facility:', error);
      setMessage(error.message);
      return;
    }
    const imageCleanupSucceeded = !item.image_path && !getSchoolImagePathFromUrl(item.image_url)
      ? true
      : await deleteSchoolImage(item.image_path || getSchoolImagePathFromUrl(item.image_url) || '');
    const refreshed = await load();
    const deletedMessage = refreshed
      ? t('Sarana berhasil dihapus.', 'Facility deleted successfully.')
      : t('Sarana berhasil dihapus, tetapi daftar belum dapat diperbarui.', 'Facility was deleted, but the list could not be refreshed.');
    setMessage(imageCleanupSucceeded
      ? deletedMessage
      : `${deletedMessage} ${t('File gambar belum berhasil dihapus dari penyimpanan.', 'The image file could not be deleted from storage.')}`);
  };

  const openAddForm = () => {
    setMessage('');
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setRemoveImage(false);
    setFormOpen(true);
  };

  if (loading) return <div className="admin-loading" role="status"><span>{t('Memuat sarana...', 'Loading facilities...')}</span></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Lingkungan Sekolah', 'School Environment')}</p>
            <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Sarana & Prasarana', 'Facilities')}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Kelola fasilitas dan lingkungan belajar yang tampil di website.', 'Manage the facilities and learning environment shown on the website.')}</p>
          </div>
          <button type="button" onClick={openAddForm} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800">
            {t('Tambah Sarana', 'Add Facility')}
          </button>
        </header>

        {message && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-sky-300">{message}</p>}

        <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
          <h2 className="text-lg font-black">{t('Konten yang dikelola', 'Managed facilities')} ({items.length})</h2>
          <div className="mt-5 grid gap-4">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 p-4 dark:border-white/10 sm:flex-row">
                {item.image_url && <img src={item.image_url} alt={item.name} className="h-32 w-full rounded-xl bg-blue-50 object-cover dark:bg-slate-800 sm:w-48" />}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
                <div className="flex self-start gap-1">
                  <button type="button" onClick={() => { setMessage(''); setEditing(item); setForm({ name: item.name, description: item.description }); setFile(null); setRemoveImage(false); setFormOpen(true); }} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20">{t('Edit', 'Edit')}</button>
                  <button type="button" onClick={() => void remove(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20">{t('Hapus', 'Delete')}</button>
                </div>
              </article>
            ))}
            {items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t('Belum ada sarana.', 'No facilities yet.')}</p>}
          </div>
        </section>

        <AdminFormModal open={formOpen} title={editing ? t('Edit Sarana', 'Edit Facility') : t('Tambah Sarana', 'Add Facility')} onClose={() => setFormOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{message}</p>}
            <input required placeholder={t('Nama fasilitas', 'Facility name')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-900" />
            <textarea required rows={5} placeholder={t('Deskripsi fasilitas', 'Facility description')} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm leading-relaxed dark:border-white/10 dark:bg-slate-900" />
            <AdminImageField
              label={t('Foto sarana', 'Facility image')}
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
              {saving ? t('Menyimpan...', 'Saving...') : editing ? t('Simpan Perubahan', 'Save Changes') : t('Tambah Sarana', 'Add Facility')}
            </button>
          </form>
        </AdminFormModal>
      </div>
    </div>
  );
}
