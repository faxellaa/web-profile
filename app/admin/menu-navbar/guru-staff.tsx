'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { deleteSchoolImage, uploadSchoolImage } from '@/lib/storage';
import AdminNavbar from '../components/navbar';
import { HEADMASTER_NAME } from '@/lib/school-content';

type Teacher = { id: string; name: string; title: string; role: string; photo_url?: string; photo_path?: string; sort_order: number };
const emptyTeacher = { name: '', title: '', role: 'Guru', sort_order: 0 };

export default function GuruStaffPage() {
  const router = useRouter();
  const { t } = useLang();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherForm, setTeacherForm] = useState(emptyTeacher);
  const [teacherFile, setTeacherFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [headmaster, setHeadmaster] = useState({ name: HEADMASTER_NAME, speech: '', photoUrl: '', photoPath: '' });
  const [headmasterFile, setHeadmasterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [teacherResult, statsResult] = await Promise.all([
      supabase.from('teachers').select('*').order('sort_order').order('name'),
      supabase.from('school_stats').select('*').limit(1).maybeSingle(),
    ]);
    if (teacherResult.data) setTeachers(teacherResult.data);
    if (statsResult.data) setHeadmaster({ name: HEADMASTER_NAME, speech: statsResult.data.headmaster_speech || '', photoUrl: statsResult.data.headmaster_photo_url || '', photoPath: statsResult.data.headmaster_photo_path || '' });
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace('/admin/login');
      await load();
      setLoading(false);
    });
  }, [router]);

  const saveTeacher = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    let photo_url = editing?.photo_url || null;
    let photo_path = editing?.photo_path || null;
    if (teacherFile) {
      if (photo_path) await deleteSchoolImage(photo_path);
      const uploaded = await uploadSchoolImage(teacherFile, 'guru');
      photo_url = uploaded.publicUrl;
      photo_path = uploaded.filePath;
    }
    const payload = { ...teacherForm, photo_url, photo_path, updated_at: new Date().toISOString() };
    const result = editing ? await supabase.from('teachers').update(payload).eq('id', editing.id) : await supabase.from('teachers').insert(payload);
    setMessage(result.error ? result.error.message : t('Data guru berhasil disimpan.', 'Teacher data saved successfully.'));
    if (!result.error) { setTeacherForm(emptyTeacher); setTeacherFile(null); setEditing(null); await load(); }
    setSaving(false);
  };

  const saveHeadmaster = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    let photoUrl = headmaster.photoUrl;
    let photoPath = headmaster.photoPath;
    if (headmasterFile) {
      if (photoPath) await deleteSchoolImage(photoPath);
      const uploaded = await uploadSchoolImage(headmasterFile, 'kepala-sekolah');
      photoUrl = uploaded.publicUrl;
      photoPath = uploaded.filePath;
    }
    const { data: existing } = await supabase.from('school_stats').select('id').limit(1);
    const payload = { headmaster_name: headmaster.name, headmaster_speech: headmaster.speech, headmaster_photo_url: photoUrl, headmaster_photo_path: photoPath, updated_at: new Date().toISOString() };
    const result = existing?.[0] ? await supabase.from('school_stats').update(payload).eq('id', existing[0].id) : await supabase.from('school_stats').insert(payload);
    setMessage(result.error ? result.error.message : t('Sambutan kepala sekolah berhasil disimpan.', "Principal's message saved successfully."));
    if (!result.error) { setHeadmaster({ ...headmaster, photoUrl, photoPath }); setHeadmasterFile(null); await load(); }
    setSaving(false);
  };

  const removeTeacher = async (teacher: Teacher) => {
    if (!window.confirm(t(`Hapus ${teacher.name}?`, `Delete ${teacher.name}?`))) return;
    if (teacher.photo_path) await deleteSchoolImage(teacher.photo_path);
    await supabase.from('teachers').delete().eq('id', teacher.id);
    await load();
  };

  if (loading) return <div className="admin-loading" role="status"><span>{t('Memuat data guru dan staff...', 'Loading teacher and staff data...')}</span></div>;

  return <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6"><div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24"><AdminNavbar /><header className="border-b border-slate-200/70 pb-5 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Data Pendidik', 'Educator Data')}</p><h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Data Guru & Staff', 'Teacher & Staff Data')}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Kelola profil guru, staff, dan sambutan kepala sekolah dari satu halaman.', "Manage teacher and staff profiles and the principal's message from one page.")}</p></header>{message && <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-sky-300">{message}</p>}<section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><form onSubmit={saveTeacher} className="space-y-4 rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7"><h2 className="text-lg font-black text-blue-950 dark:text-white">{editing ? t('Edit Data Guru', 'Edit Teacher Data') : t('Tambah Guru / Staff', 'Add Teacher / Staff')}</h2><label className="grid gap-2 text-xs font-bold">{t('Nama lengkap', 'Full name')}<input required value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label><label className="grid gap-2 text-xs font-bold">{t('Gelar', 'Title')}<input required value={teacherForm.title} onChange={e => setTeacherForm({ ...teacherForm, title: e.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label><label className="grid gap-2 text-xs font-bold">{t('Jabatan / bidang', 'Position / field')}<input required value={teacherForm.role} onChange={e => setTeacherForm({ ...teacherForm, role: e.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label><label className="grid gap-2 text-xs font-bold">{t('Foto', 'Photo')}<input type="file" accept="image/*" onChange={e => setTeacherFile(e.target.files?.[0] || null)} className="rounded-xl border bg-slate-50 p-2.5 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label><div className="flex gap-2"><button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? t('Menyimpan...', 'Saving...') : editing ? t('Simpan Perubahan', 'Save Changes') : t('Tambah Data', 'Add Data')}</button>{editing && <button type="button" onClick={() => { setEditing(null); setTeacherForm(emptyTeacher); setTeacherFile(null); }} className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold dark:bg-slate-800">{t('Batal', 'Cancel')}</button>}</div></form><div className="space-y-4 rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7"><h2 className="text-lg font-black text-blue-950 dark:text-white">{t('Daftar Guru & Staff', 'Teacher & Staff List')} ({teachers.length})</h2><div className="max-h-[ thirtyrem ] space-y-3 overflow-y-auto pr-1">{teachers.map(teacher => <article key={teacher.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-white/10"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 font-black text-blue-700 dark:bg-slate-800 dark:text-sky-300">{teacher.photo_url ? <img src={teacher.photo_url} alt={teacher.name} className="h-full w-full object-cover" /> : teacher.name.charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{teacher.name}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{teacher.title} · {teacher.role}</p></div><button type="button" onClick={() => { setEditing(teacher); setTeacherForm({ name: teacher.name, title: teacher.title, role: teacher.role, sort_order: teacher.sort_order }); }} className="text-xs font-bold text-blue-700 dark:text-sky-400">{t('Edit', 'Edit')}</button><button type="button" onClick={() => removeTeacher(teacher)} className="text-xs font-bold text-red-600">{t('Hapus', 'Delete')}</button></article>)}</div></div></section><form onSubmit={saveHeadmaster} className="space-y-4 rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">{t('Pimpinan Sekolah', 'School Leadership')}</p><h2 className="mt-1 text-lg font-black text-blue-950 dark:text-white">{t('Sambutan Kepala Sekolah', "Principal's Message")}</h2></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-xs font-bold">{t('Nama kepala sekolah', 'Principal name')}<input required value={headmaster.name} onChange={e => setHeadmaster({ ...headmaster, name: e.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label><label className="grid gap-2 text-xs font-bold">{t('Foto kepala sekolah', 'Principal photo')}<input type="file" accept="image/*" onChange={e => setHeadmasterFile(e.target.files?.[0] || null)} className="rounded-xl border bg-slate-50 p-2.5 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label></div><label className="grid gap-2 text-xs font-bold">{t('Isi sambutan', 'Message content')}<textarea required rows={6} value={headmaster.speech} onChange={e => setHeadmaster({ ...headmaster, speech: e.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal leading-relaxed dark:border-white/10 dark:bg-slate-900" /></label><button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? t('Menyimpan...', 'Saving...') : t('Simpan Sambutan', 'Save Message')}</button></form></div></div>;
}
