'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { uploadSchoolImage } from '@/lib/storage';
import AdminFormModal from '../components/AdminFormModal';
import AdminNavbar from '../components/navbar';

type Facility = { id: string; name: string; description: string; image_url?: string };

export default function AdminSaranaPage() {
  const router = useRouter();
  const { t } = useLang();
  const [items, setItems] = useState<Facility[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [file, setFile] = useState<File | null>(null);
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

    try {
      let imageUrl: string | null = null;
      let imagePath: string | null = null;
      if (file) {
        const uploaded = await uploadSchoolImage(file, 'fasilitas');
        imageUrl = uploaded.publicUrl;
        imagePath = uploaded.filePath;
      }

      const { error } = await supabase.from('facilities').insert({
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: imageUrl,
        image_path: imagePath,
      });
      if (error) throw error;

      formElement.reset();
      setForm({ name: '', description: '' });
      setFile(null);
      const refreshed = await load();
      setMessage(refreshed
        ? t('Sarana berhasil ditambahkan.', 'Facility added successfully.')
        : t('Sarana berhasil ditambahkan, tetapi daftar belum dapat diperbarui.', 'Facility was added, but the list could not be refreshed.'));
      setFormOpen(false);
    } catch (error) {
      console.error('Failed to add facility:', error);
      setMessage(error instanceof Error ? error.message : t('Sarana gagal ditambahkan.', 'Facility could not be added.'));
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
    const refreshed = await load();
    setMessage(refreshed
      ? t('Sarana berhasil dihapus.', 'Facility deleted successfully.')
      : t('Sarana berhasil dihapus, tetapi daftar belum dapat diperbarui.', 'Facility was deleted, but the list could not be refreshed.'));
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
          <button type="button" onClick={() => { setMessage(''); setFormOpen(true); }} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800">
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
                <button type="button" onClick={() => void remove(item)} className="self-start rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">{t('Hapus', 'Delete')}</button>
              </article>
            ))}
            {items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t('Belum ada sarana.', 'No facilities yet.')}</p>}
          </div>
        </section>

        <AdminFormModal open={formOpen} title={t('Tambah Sarana', 'Add Facility')} onClose={() => setFormOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{message}</p>}
            <input required placeholder={t('Nama fasilitas', 'Facility name')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-900" />
            <textarea required rows={5} placeholder={t('Deskripsi fasilitas', 'Facility description')} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm leading-relaxed dark:border-white/10 dark:bg-slate-900" />
            <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} className="w-full rounded-xl border bg-slate-50 p-2.5 text-sm dark:border-white/10 dark:bg-slate-900" />
            <button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? t('Menyimpan...', 'Saving...') : t('Tambah Sarana', 'Add Facility')}
            </button>
          </form>
        </AdminFormModal>
      </div>
    </div>
  );
}
