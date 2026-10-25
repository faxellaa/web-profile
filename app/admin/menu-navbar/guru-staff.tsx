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
import { HEADMASTER_NAME } from '@/lib/school-content';

type Teacher = { id: string; name: string; title: string; role: string; photo_url?: string; photo_path?: string; sort_order: number };
const emptyTeacher = { name: '', title: '', role: 'Guru', sort_order: 0 };

export default function GuruStaffPage() {
  const router = useRouter();
  const { t } = useLang();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherForm, setTeacherForm] = useState(emptyTeacher);
  const [teacherFile, setTeacherFile] = useState<File | null>(null);
  const [removeTeacherPhoto, setRemoveTeacherPhoto] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [headmaster, setHeadmaster] = useState({ name: HEADMASTER_NAME, speech: '', photoUrl: '', photoPath: '' });
  const [headmasterFile, setHeadmasterFile] = useState<File | null>(null);
  const [removeHeadmasterPhoto, setRemoveHeadmasterPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherFormOpen, setTeacherFormOpen] = useState(false);
  const [headmasterFormOpen, setHeadmasterFormOpen] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [teacherResult, statsResult] = await Promise.all([
      supabase.from('teachers').select('*').order('sort_order').order('name'),
      supabase.from('school_stats').select('*').limit(1).maybeSingle(),
    ]);
    if (teacherResult.error) {
      console.error('Failed to load school staff:', teacherResult.error);
      setMessage(t('Data tenaga kerja gagal dimuat.', 'School staff data could not be loaded.'));
    } else if (teacherResult.data) {
      setTeachers(teacherResult.data);
    }
    if (statsResult.error) {
      console.error('Failed to load principal information:', statsResult.error);
    } else if (statsResult.data) {
      setHeadmaster({ name: HEADMASTER_NAME, speech: statsResult.data.headmaster_speech || '', photoUrl: statsResult.data.headmaster_photo_url || '', photoPath: statsResult.data.headmaster_photo_path || '' });
    }
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

  const saveTeacher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    let photoUrl = removeTeacherPhoto ? null : editing?.photo_url || null;
    let photoPath = removeTeacherPhoto ? null : editing?.photo_path || getSchoolImagePathFromUrl(editing?.photo_url);
    let uploadedPath: string | null = null;

    try {
      if (teacherFile) {
        const uploaded = await uploadSchoolImage(teacherFile, 'guru');
        uploadedPath = uploaded.filePath;
        photoUrl = uploaded.publicUrl;
        photoPath = uploaded.filePath;
      }
      const payload = { ...teacherForm, photo_url: photoUrl, photo_path: photoPath, updated_at: new Date().toISOString() };
      const result = editing
        ? await supabase.from('teachers').update(payload).eq('id', editing.id)
        : await supabase.from('teachers').insert(payload);
      if (result.error) throw result.error;

      const oldPhotoPath = editing?.photo_path || getSchoolImagePathFromUrl(editing?.photo_url);
      const cleanupSucceeded = !oldPhotoPath || (!teacherFile && !removeTeacherPhoto) || await deleteSchoolImage(oldPhotoPath);
      setTeacherForm(emptyTeacher);
      setTeacherFile(null);
      setRemoveTeacherPhoto(false);
      setEditing(null);
      await load();
      setMessage(cleanupSucceeded
        ? t('Data tenaga kerja berhasil disimpan.', 'School staff data saved successfully.')
        : `${t('Data tenaga kerja berhasil disimpan.', 'School staff data saved successfully.')} ${t('Foto lama belum berhasil dihapus dari penyimpanan.', 'The old photo could not be deleted from storage.')}`);
      setTeacherFormOpen(false);
    } catch (error) {
      console.error('Failed to save school staff:', error);
      if (uploadedPath) await deleteSchoolImage(uploadedPath);
      setMessage(error instanceof Error ? error.message : t('Data tenaga kerja gagal disimpan.', 'School staff data could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const saveHeadmaster = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    let photoUrl = removeHeadmasterPhoto ? null : headmaster.photoUrl || null;
    let photoPath = removeHeadmasterPhoto ? null : headmaster.photoPath || getSchoolImagePathFromUrl(headmaster.photoUrl);
    let uploadedPath: string | null = null;

    try {
      if (headmasterFile) {
        const uploaded = await uploadSchoolImage(headmasterFile, 'kepala-sekolah');
        uploadedPath = uploaded.filePath;
        photoUrl = uploaded.publicUrl;
        photoPath = uploaded.filePath;
      }
      const { data: existing, error: existingError } = await supabase.from('school_stats').select('id').limit(1);
      if (existingError) throw existingError;
      const payload = { headmaster_name: headmaster.name, headmaster_speech: headmaster.speech, headmaster_photo_url: photoUrl, headmaster_photo_path: photoPath, updated_at: new Date().toISOString() };
      const result = existing?.[0]
        ? await supabase.from('school_stats').update(payload).eq('id', existing[0].id)
        : await supabase.from('school_stats').insert(payload);
      if (result.error) throw result.error;

      const oldPhotoPath = headmaster.photoPath || getSchoolImagePathFromUrl(headmaster.photoUrl);
      const cleanupSucceeded = !oldPhotoPath || (!headmasterFile && !removeHeadmasterPhoto) || await deleteSchoolImage(oldPhotoPath);
      setHeadmaster({ ...headmaster, photoUrl: photoUrl || '', photoPath: photoPath || '' });
      setHeadmasterFile(null);
      setRemoveHeadmasterPhoto(false);
      await load();
      setMessage(cleanupSucceeded
        ? t('Sambutan kepala sekolah berhasil disimpan.', "Principal's message saved successfully.")
        : `${t('Sambutan kepala sekolah berhasil disimpan.', "Principal's message saved successfully.")} ${t('Foto lama belum berhasil dihapus dari penyimpanan.', 'The old photo could not be deleted from storage.')}`);
      setHeadmasterFormOpen(false);
    } catch (error) {
      console.error('Failed to save principal information:', error);
      if (uploadedPath) await deleteSchoolImage(uploadedPath);
      setMessage(error instanceof Error ? error.message : t('Sambutan kepala sekolah gagal disimpan.', "Principal's message could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const removeTeacher = async (teacher: Teacher) => {
    if (!window.confirm(t(`Hapus ${teacher.name}?`, `Delete ${teacher.name}?`))) return;
    const { error } = await supabase.from('teachers').delete().eq('id', teacher.id);
    if (error) {
      console.error('Failed to delete school staff member:', error);
      setMessage(error.message);
      return;
    }
    const photoPath = teacher.photo_path || getSchoolImagePathFromUrl(teacher.photo_url);
    const cleanupSucceeded = !photoPath || await deleteSchoolImage(photoPath);
    await load();
    setMessage(cleanupSucceeded
      ? t('Data tenaga kerja berhasil dihapus.', 'School staff member deleted successfully.')
      : `${t('Data tenaga kerja berhasil dihapus.', 'School staff member deleted successfully.')} ${t('File foto belum berhasil dihapus dari penyimpanan.', 'The photo file could not be deleted from storage.')}`);
  };

  const openAddTeacher = () => {
    setMessage('');
    setEditing(null);
    setTeacherForm(emptyTeacher);
    setTeacherFile(null);
    setRemoveTeacherPhoto(false);
    setTeacherFormOpen(true);
  };

  const openEditTeacher = (teacher: Teacher) => {
    setMessage('');
    setEditing(teacher);
    setTeacherForm({ name: teacher.name, title: teacher.title, role: teacher.role, sort_order: teacher.sort_order });
    setTeacherFile(null);
    setRemoveTeacherPhoto(false);
    setTeacherFormOpen(true);
  };

  if (loading) return <div className="admin-loading" role="status"><span>{t('Memuat data tenaga kerja...', 'Loading school staff data...')}</span></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Data Tenaga Kerja', 'School Staff Data')}</p>
            <h1 className="mt-2 text-2xl font-black text-blue-950 dark:text-white sm:text-3xl">{t('Tenaga Kerja', 'School Staff')}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Kelola tenaga kerja dan informasi pimpinan sekolah.', 'Manage school staff and leadership information.')}</p>
          </div>
          <button type="button" onClick={openAddTeacher} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800">
            {t('Tambah Tenaga Kerja', 'Add Staff Member')}
          </button>
        </header>

        {message && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-sky-300">{message}</p>}

        <section className="rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
          <h2 className="text-lg font-black">{t('Konten yang dikelola', 'Managed staff')} ({teachers.length})</h2>
          <div className="mt-5 space-y-3">
            {teachers.map((teacher) => (
              <article key={teacher.id} className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 p-4 dark:border-white/10 sm:flex-row">
                {teacher.photo_url ? (
                  <img src={teacher.photo_url} alt={teacher.name} className="h-32 w-full shrink-0 rounded-xl bg-blue-50 object-cover dark:bg-slate-800 sm:w-48" />
                ) : (
                  <div role="img" aria-label={t('Foto belum tersedia', 'Photo not available')} className="flex h-32 w-full shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-xs font-medium text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-500 sm:w-48">
                    <ImageOff aria-hidden="true" className="h-6 w-6" />
                    <span>{t('Foto belum tersedia', 'Photo not available')}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{teacher.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{teacher.title} · {teacher.role}</p>
                </div>
                <div className="flex self-start gap-1">
                  <button type="button" onClick={() => openEditTeacher(teacher)} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20">{t('Edit', 'Edit')}</button>
                  <button type="button" onClick={() => void removeTeacher(teacher)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20">{t('Hapus', 'Delete')}</button>
                </div>
              </article>
            ))}
            {teachers.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t('Belum ada data tenaga kerja.', 'No school staff data yet.')}</p>}
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">{t('Pimpinan Sekolah', 'School Leadership')}</p>
            <h2 className="mt-1 text-lg font-black text-blue-950 dark:text-white">{t('Sambutan Kepala Sekolah', "Principal's Message")}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{headmaster.name} · {headmaster.speech ? t('Sambutan sudah diisi', 'Message has been filled in') : t('Sambutan belum diisi', 'Message has not been filled in')}</p>
          </div>
          <button type="button" onClick={() => { setMessage(''); setHeadmasterFile(null); setRemoveHeadmasterPhoto(false); setHeadmasterFormOpen(true); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-white/10 dark:text-sky-400 dark:hover:bg-slate-800">
            {t('Edit Sambutan', 'Edit Message')}
          </button>
        </section>

        <AdminFormModal open={teacherFormOpen} title={editing ? t('Edit Data Tenaga Kerja', 'Edit Staff Data') : t('Tambah Tenaga Kerja', 'Add Staff Member')} onClose={() => setTeacherFormOpen(false)}>
          <form onSubmit={saveTeacher} className="space-y-4">
            {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{message}</p>}
            <label className="grid gap-2 text-xs font-bold">{t('Nama lengkap', 'Full name')}<input required value={teacherForm.name} onChange={(event) => setTeacherForm({ ...teacherForm, name: event.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label>
            <label className="grid gap-2 text-xs font-bold">{t('Gelar', 'Title')}<input required value={teacherForm.title} onChange={(event) => setTeacherForm({ ...teacherForm, title: event.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label>
            <label className="grid gap-2 text-xs font-bold">{t('Jabatan / bidang', 'Position / field')}<input required value={teacherForm.role} onChange={(event) => setTeacherForm({ ...teacherForm, role: event.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label>
            <AdminImageField
              label={t('Foto tenaga kerja', 'Staff photo')}
              imageUrl={editing?.photo_url}
              file={teacherFile}
              removeImage={removeTeacherPhoto}
              onFileChange={(selectedFile) => { setTeacherFile(selectedFile); if (selectedFile) setRemoveTeacherPhoto(false); }}
              onRemoveImage={() => { setRemoveTeacherPhoto(true); setTeacherFile(null); }}
              onRestoreImage={() => setRemoveTeacherPhoto(false)}
              unavailableLabel={t('Foto belum tersedia', 'Photo not available')}
              chooseImageLabel={t('Pilih foto untuk mengganti atau menambahkan', 'Choose a photo to replace or add')}
              removeImageLabel={t('Hapus foto', 'Remove photo')}
              restoreImageLabel={t('Batalkan hapus foto', 'Undo photo removal')}
            />
            <button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? t('Menyimpan...', 'Saving...') : editing ? t('Simpan Perubahan', 'Save Changes') : t('Tambah Tenaga Kerja', 'Add Staff Member')}</button>
          </form>
        </AdminFormModal>

        <AdminFormModal open={headmasterFormOpen} title={t('Edit Sambutan Kepala Sekolah', "Edit Principal's Message")} onClose={() => setHeadmasterFormOpen(false)}>
          <form onSubmit={saveHeadmaster} className="space-y-4">
            {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{message}</p>}
            <label className="grid gap-2 text-xs font-bold">{t('Nama kepala sekolah', 'Principal name')}<input required value={headmaster.name} onChange={(event) => setHeadmaster({ ...headmaster, name: event.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-slate-900" /></label>
            <AdminImageField
              label={t('Foto kepala sekolah', 'Principal photo')}
              imageUrl={headmaster.photoUrl}
              file={headmasterFile}
              removeImage={removeHeadmasterPhoto}
              onFileChange={(selectedFile) => { setHeadmasterFile(selectedFile); if (selectedFile) setRemoveHeadmasterPhoto(false); }}
              onRemoveImage={() => { setRemoveHeadmasterPhoto(true); setHeadmasterFile(null); }}
              onRestoreImage={() => setRemoveHeadmasterPhoto(false)}
              unavailableLabel={t('Foto belum tersedia', 'Photo not available')}
              chooseImageLabel={t('Pilih foto untuk mengganti atau menambahkan', 'Choose a photo to replace or add')}
              removeImageLabel={t('Hapus foto', 'Remove photo')}
              restoreImageLabel={t('Batalkan hapus foto', 'Undo photo removal')}
            />
            <label className="grid gap-2 text-xs font-bold">{t('Isi sambutan', 'Message content')}<textarea required rows={6} value={headmaster.speech} onChange={(event) => setHeadmaster({ ...headmaster, speech: event.target.value })} className="rounded-xl border bg-slate-50 p-3 text-sm font-normal leading-relaxed dark:border-white/10 dark:bg-slate-900" /></label>
            <button disabled={saving} className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? t('Menyimpan...', 'Saving...') : t('Simpan Sambutan', 'Save Message')}</button>
          </form>
        </AdminFormModal>
      </div>
    </div>
  );
}
