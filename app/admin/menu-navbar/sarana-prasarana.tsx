'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { uploadSchoolImage } from '@/lib/storage';
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
  const [message, setMessage] = useState('');
  const load = async () => { const { data } = await supabase.from('facilities').select('*'); if (data) setItems(data); };
  useEffect(() => { supabase.auth.getSession().then(async ({ data }) => { if (!data.session) return router.replace('/admin/login'); await load(); setLoading(false); }); }, [router]);
  const save = async (event: FormEvent) => { event.preventDefault(); setSaving(true); let image_url = null; let image_path = null; if (file) { const uploaded = await uploadSchoolImage(file, 'fasilitas'); image_url = uploaded.publicUrl; image_path = uploaded.filePath; } const result = await supabase.from('facilities').insert({ ...form, image_url, image_path }); setMessage(result.error ? result.error.message : t('Sarana berhasil ditambahkan.', 'Facility added successfully.')); if (!result.error) { setForm({ name: '', description: '' }); setFile(null); await load(); } setSaving(false); };
  const remove = async (item: Facility) => { if (!window.confirm(t(`Hapus ${item.name}?`, `Delete ${item.name}?`))) return; const result = await supabase.from('facilities').delete().eq('id', item.id); if (result.error) setMessage(result.error.message); else await load(); };
  if (loading) return <div className="admin-loading" role="status"><span>{t('Memuat sarana...', 'Loading facilities...')}</span></div>;
  return <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6"><div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24"><AdminNavbar /><header className="border-b border-slate-200/70 pb-5 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Lingkungan Sekolah', 'School Environment')}</p><h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Sarana & Prasarana', 'Facilities')}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Kelola fasilitas dan lingkungan belajar yang tampil di website.', 'Manage the facilities and learning environment shown on the website.')}</p></header>{message && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-sky-300">{message}</p>}<div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><form onSubmit={save} className="space-y-4 rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7"><h2 className="text-lg font-black">{t('Tambah Sarana', 'Add Facility')}</h2><input required placeholder={t('Nama fasilitas', 'Facility name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-900" /><textarea required rows={5} placeholder={t('Deskripsi fasilitas', 'Facility description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm leading-relaxed dark:border-white/10 dark:bg-slate-900" /><input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border bg-slate-50 p-2.5 text-sm dark:border-white/10 dark:bg-slate-900" /><button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? t('Menyimpan...', 'Saving...') : t('Tambah Sarana', 'Add Facility')}</button></form><section className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7"><h2 className="text-lg font-black">{t('Daftar Sarana', 'Facility List')} ({items.length})</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{items.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/10"><div className="h-32 bg-blue-50 dark:bg-slate-800">{item.image_url && <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />}</div><div className="p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{item.name}</h3><button onClick={() => remove(item)} className="text-xs font-bold text-red-600">{t('Hapus', 'Delete')}</button></div><p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p></div></article>)}{items.length === 0 && <p className="py-8 text-center text-sm text-slate-400 sm:col-span-2">{t('Belum ada sarana.', 'No facilities yet.')}</p>}</div></section></div></div></div>;
}
