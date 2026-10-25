'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import AdminNavbar from '../components/navbar';
import { HEADMASTER_NAME } from '@/lib/school-content';

type OverviewData = {
  achievements: { id: string; title: string; category: string }[];
  activities: { id: string; action: 'insert' | 'update' | 'delete'; entity_type: string; entity_title: string; created_at: string }[];
  teachers: { id: string; name: string; role: string }[];
  extracurriculars: { id: string; name: string; tag: string }[];
  facilities: { id: string; name: string }[];
  applications: number;
  gallery: number;
  headmaster: { name: string; speech: string; photo_url: string };
};

const emptyData: OverviewData = {
  achievements: [],
  activities: [],
  teachers: [],
  extracurriculars: [],
  facilities: [],
  applications: 0,
  gallery: 0,
  headmaster: { name: HEADMASTER_NAME, speech: '', photo_url: '' },
};

const cards = [
  { key: 'applications', label: 'Pendaftar SPMB', en: 'SPMB Applicants', href: '/admin/spmb', color: 'violet' },
  { key: 'gallery', label: 'Galeri Foto & Video', en: 'Photo & Video Gallery', href: '/admin/galeri', color: 'cyan' },
  { key: 'achievements', label: 'Prestasi', en: 'Achievements', href: '/admin/prestasi', color: 'blue' },
  { key: 'teachers', label: 'Tenaga Kerja', en: 'School Staff', href: '/admin/guru-staff', color: 'sky' },
  { key: 'extracurriculars', label: 'Ekstrakulikuler', en: 'Extracurriculars', href: '/admin/ekstrakulikuler', color: 'emerald' },
  { key: 'facilities', label: 'Sarana & Prasarana', en: 'Facilities', href: '/admin/sarana-prasarana', color: 'amber' },
] as const;

export default function AdminDashboard() {
  const router = useRouter();
  const { lang, t } = useLang();
  const [data, setData] = useState<OverviewData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to read dashboard admin session:', sessionError);
        setLoading(false);
        return;
      }
      if (!sessionData.session) {
        router.replace('/admin/login');
        return;
      }

      const [achievements, activities, teachers, extracurriculars, facilities, stats, applications, gallery] = await Promise.all([
        supabase.from('articles').select('id,title,category').eq('category', 'Prestasi Siswa').order('created_at', { ascending: false }),
        supabase.from('admin_activity_log').select('id,action,entity_type,entity_title,created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('teachers').select('id,name,role').order('sort_order').order('name'),
        supabase.from('extracurriculars').select('id,name,tag').order('created_at', { ascending: false }),
        supabase.from('facilities').select('id,name'),
        supabase.from('school_stats').select('headmaster_name,headmaster_speech,headmaster_photo_url').limit(1).maybeSingle(),
        supabase.from('spmb_applications').select('id', { count: 'exact', head: true }),
        supabase.from('school_gallery_items').select('id', { count: 'exact', head: true }),
      ]);

      const failedQueries = [
        achievements.error && 'achievements',
        activities.error && 'admin_activity_log',
        teachers.error && 'teachers',
        extracurriculars.error && 'extracurriculars',
        facilities.error && 'facilities',
        stats.error && 'school_stats',
        applications.error && 'spmb_applications',
        gallery.error && 'school_gallery_items',
      ].filter(Boolean);
      if (failedQueries.length) {
        console.error('Some admin dashboard data could not be loaded:', failedQueries);
      }

      setData({
        achievements: achievements.data || [],
        activities: activities.data || [],
        teachers: teachers.data || [],
        extracurriculars: extracurriculars.data || [],
        facilities: facilities.data || [],
        applications: applications.count || 0,
        gallery: gallery.count || 0,
        headmaster: {
          name: HEADMASTER_NAME,
          speech: stats.data?.headmaster_speech || '',
          photo_url: stats.data?.headmaster_photo_url || '',
        },
      });
      setLoading(false);
    };
    void loadDashboard();
  }, [router]);

  if (loading) return <div className="admin-loading" role="status" aria-label={t('Memuat dashboard', 'Loading dashboard')}><span>{t('Memuat data admin...', 'Loading admin data...')}</span></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-800 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-7 pt-20 sm:pt-24">
        <AdminNavbar />
        <header className="border-b border-slate-200/70 pb-5 text-center dark:border-white/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-sky-400">{t('Panel Pengelola Resmi', 'Official Management Panel')}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-blue-950 dark:text-white sm:text-3xl">{t('Ringkasan Data Admin', 'Admin Data Summary')}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t('Pantau seluruh data yang tersimpan dan buka menu terkait untuk melakukan perubahan.', 'Monitor all stored data and open the related menu to make changes.')}</p>
        </header>

        <section>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-4 dark:border-white/10"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">{t('Informasi pimpinan', 'Leadership information')}</p><h2 className="mt-1 text-lg font-black text-blue-950 dark:text-white">{t('Sambutan Kepala Sekolah', "Principal's Message")}</h2></div><Link href="/admin/guru-staff" className="text-xs font-bold text-blue-700 dark:text-sky-400">{t('Edit', 'Edit')}</Link></div>
            <div className="mt-5 flex items-center gap-4">{data.headmaster.photo_url ? <img src={data.headmaster.photo_url} alt={data.headmaster.name} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700 dark:bg-slate-800 dark:text-sky-300">{data.headmaster.name.charAt(0)}</div>}<div><p className="font-bold text-slate-700 dark:text-slate-200">{data.headmaster.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data.headmaster.speech ? t('Sambutan sudah diisi', 'Message has been filled in') : t('Sambutan belum diisi', 'Message has not been filled in')}</p></div></div>
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-7">
            <div className="border-b border-slate-200/70 pb-4 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">{t('Data terbaru', 'Latest data')}</p><h2 className="mt-1 text-lg font-black text-blue-950 dark:text-white">{t('Aktivitas Terbaru', 'Recent Activity')}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('Perubahan data yang dilakukan admin.', 'Changes made by an admin.')}</p></div>
            <div className="divide-y divide-slate-200/70 dark:divide-white/10">
              {data.activities.map((activity) => {
                const actionLabel = activity.action === 'insert'
                  ? t('Ditambahkan', 'Added')
                  : activity.action === 'update'
                    ? t('Diubah', 'Updated')
                    : t('Dihapus', 'Deleted');
                const actionStyle = activity.action === 'insert'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                  : activity.action === 'update'
                    ? 'bg-blue-50 text-blue-700 dark:bg-sky-400/10 dark:text-sky-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300';
                return (
                  <div key={activity.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${actionStyle}`}>{actionLabel}</span>
                        <span>{activity.entity_type}</span>
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{activity.entity_title}</p>
                    </div>
                    <time dateTime={activity.created_at} className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(activity.created_at).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                  </div>
                );
              })}
              {data.activities.length === 0 && <p className="py-8 text-center text-sm text-slate-400">{t('Belum ada aktivitas admin yang tercatat.', 'No admin activity has been recorded yet.')}</p>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5">
          {cards.map((card) => (
            <Link key={card.key} href={card.href} className="group flex min-h-40 items-center justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white/90 px-8 py-8 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-sky-300/30 dark:hover:bg-white/[0.08]">
              <div className="flex min-w-0 items-center gap-3">
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{t(card.label, card.en)}</p>
                <span className="text-3xl font-black text-blue-700 dark:text-sky-300">{card.key === 'applications' ? data.applications : card.key === 'gallery' ? data.gallery : data[card.key].length}</span>
              </div>
              <p className="shrink-0 text-base font-semibold text-blue-600 transition-colors group-hover:text-blue-800 dark:text-sky-400 dark:group-hover:text-sky-300">{t('Kelola data', 'Manage data')}</p>
            </Link>
          ))}
        </section>

      </div>
    </div>
  );
}
