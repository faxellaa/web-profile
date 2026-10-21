'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { uploadSchoolImage } from '@/lib/storage';
import AdminNavbar from '../components/navbar';

type Article = { id: string; title: string; category: string; description: string; image_url?: string; created_at?: string };

export default function AdminBeritaPage() {
  const router = useRouter();
  const { t } = useLang();
  const [items, setItems] = useState<Article[]>([]);
  const [form, setForm] = useState({ title: '', category: 'Prestasi Siswa', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => { const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false }); if (data) setItems(data); };
  useEffect(() => { supabase.auth.getSession().then(async ({ data }) => { if (!data.session) return router.replace('/admin/login'); await load(); setLoading(false); }); }, [router]);

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    let image_url = null; let image_path = null;
    if (file) { const uploaded = await uploadSchoolImage(file, 'berita'); image_url = uploaded.publicUrl; image_path = uploaded.filePath; }
    const result = await supabase.from('articles').insert({ ...form, image_url, image_path, date_label: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
    setMessage(result.error ? result.error.message : t('Berita berhasil ditambahkan.', 'News added successfully.'));
    if (!result.error) { setForm({ title: '', category: 'Prestasi Siswa', description: '' }); setFile(null); await load(); }
    setSaving(false);
  };

  const remove = async (item: Article) => { if (!window.confirm(t(`Hapus ${item.title}?`, `Delete ${item.title}?`))) return; const result = await supabase.from('articles').delete().eq('id', item.id); if (result.error) setMessage(result.error.message); else await load(); };
  if (loading) return <div className="admin-loading" role="status"><span>{t('Memuat berita...', 'Loading news...')}</span></div>;

  return <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6"><div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24"><AdminNavbar /><header className="border-b border-slate-200/70 pb-5 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Konten Sekolah', 'School Content')}</p><h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Berita & Prestasi', 'News & Achievements')}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Kelola artikel kegiatan dan capaian sekolah.', 'Manage articles about school activities and achievements.')}</p></header>{message && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-sky-300">{message}</p>}<div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><form onSubmit={save} className="space-y-4 rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7"><h2 className="text-lg font-black">{t('Tambah Berita', 'Add News')}</h2><input required placeholder={t('Judul berita', 'News title')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-900" /><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-slate-900"><option value="Prestasi Siswa">{t('Prestasi Siswa', 'Student Achievements')}</option><option value="Kabar Pendidik">{t('Kabar Pendidik', 'Educator News')}</option><option value="Kegiatan Siswa">{t('Kegiatan Siswa', 'Student Activities')}</option></select><textarea required rows={5} placeholder={t('Deskripsi singkat', 'Short description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border bg-slate-50 p-3 text-sm leading-relaxed dark:border-white/10 dark:bg-slate-900" /><input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border bg-slate-50 p-2.5 text-sm dark:border-white/10 dark:bg-slate-900" /><button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? t('Menyimpan...', 'Saving...') : t('Tambah Berita', 'Add News')}</button></form><section className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7"><h2 className="text-lg font-black">{t('Daftar Berita', 'News List')} ({items.length})</h2><div className="mt-5 divide-y divide-slate-200/70 dark:divide-white/10">{items.map(item => <article key={item.id} className="flex gap-3 py-4"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-blue-50 dark:bg-slate-800">{item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-blue-600 dark:text-sky-400">{item.category}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p></div><button onClick={() => remove(item)} className="self-start text-xs font-bold text-red-600">{t('Hapus', 'Delete')}</button></article>)}{items.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t('Belum ada berita.', 'No news yet.')}</p>}</div></section></div></div></div>;
}
