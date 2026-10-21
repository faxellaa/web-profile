'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

type AccessState = {
  pathname: string;
  status: 'checking' | 'authorized' | 'unauthorized' | 'error';
};

const publicAdminPaths = new Set([
  '/admin/login',
  '/admin/lupa-password',
  '/admin/reset-password',
]);

export default function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();
  const [access, setAccess] = useState<AccessState>({ pathname: '', status: 'checking' });
  const state = access.pathname === pathname ? access.status : 'checking';

  useEffect(() => {
    let active = true;
    if (publicAdminPaths.has(pathname)) return () => { active = false; };

    const verifyAccess = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to read admin session:', sessionError);
        if (active) setAccess({ pathname, status: 'error' });
        return;
      }
      if (!sessionData.session) {
        if (active) setAccess({ pathname, status: 'unauthorized' });
        router.replace('/admin/login');
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser(sessionData.session.access_token);
      if (userError) {
        console.error('Failed to verify admin identity:', userError);
        if (active) setAccess({ pathname, status: 'error' });
        return;
      }

      if (active) {
        setAccess({
          pathname,
          status: userData.user.app_metadata?.role === 'admin' ? 'authorized' : 'unauthorized',
        });
      }
    };

    void verifyAccess();
    return () => { active = false; };
  }, [pathname, router]);

  if (publicAdminPaths.has(pathname) || state === 'authorized') return children;
  if (state === 'unauthorized' && pathname !== '/admin/login') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/85 p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/85 sm:p-8">
          <h1 className="text-xl font-black text-slate-950 dark:text-white">
            {t('Akses admin dibatasi', 'Admin access is restricted')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t(
              'Gunakan akun Supabase yang telah diberi role admin oleh pengelola sekolah.',
              'Sign in with a Supabase account assigned the admin role by the school owner.',
            )}
          </p>
          <Link href="/admin/login" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-800">
            {t('Kembali ke halaman masuk', 'Return to sign in')}
          </Link>
        </section>
      </main>
    );
  }
  if (state === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <p role="alert" className="max-w-md rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-center text-sm leading-6 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
          {t('Identitas admin belum dapat diverifikasi. Periksa koneksi lalu muat ulang halaman.', 'Admin identity could not be verified. Check your connection and reload the page.')}
        </p>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <p role="status" className="rounded-xl border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300">
        {t('Memeriksa akses admin…', 'Checking admin access…')}
      </p>
    </main>
  );
}
