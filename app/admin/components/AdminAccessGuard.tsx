'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { ADMIN_IDLE_TIMEOUT_MS, ADMIN_LAST_ACTIVITY_STORAGE_KEY } from '@/lib/admin-session';

type AccessState = {
  pathname: string;
  status: 'checking' | 'authorized' | 'unauthorized' | 'error';
  errorMessage?: string;
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
      try {
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

        if (userData.user.app_metadata?.role !== 'admin') {
          if (active) setAccess({ pathname, status: 'unauthorized' });
          return;
        }

        const now = Date.now();
        const storedLastActivity = window.localStorage.getItem(ADMIN_LAST_ACTIVITY_STORAGE_KEY);
        const lastActivityAt = storedLastActivity === null ? null : Number(storedLastActivity);
        const expired = lastActivityAt !== null
          && (!Number.isFinite(lastActivityAt) || now - lastActivityAt >= ADMIN_IDLE_TIMEOUT_MS);

        if (expired) {
          const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
          if (signOutError) {
            console.error('Failed to end expired admin session:', signOutError);
            if (active) {
              setAccess({
                pathname,
                status: 'error',
                errorMessage: t(
                  'Sesi admin kedaluwarsa, tetapi belum dapat diakhiri. Silakan coba lagi.',
                  'The admin session expired but could not be ended. Please try again.',
                ),
              });
            }
            return;
          }

          try {
            window.localStorage.removeItem(ADMIN_LAST_ACTIVITY_STORAGE_KEY);
          } catch (error) {
            console.error('Failed to clear expired admin activity timestamp:', error);
          }
          if (active) {
            setAccess({ pathname, status: 'unauthorized' });
            router.replace('/admin/login');
          }
          return;
        }

        if (lastActivityAt === null || lastActivityAt > now) {
          window.localStorage.setItem(ADMIN_LAST_ACTIVITY_STORAGE_KEY, String(now));
        }
        if (active) setAccess({ pathname, status: 'authorized' });
      } catch (error) {
        console.error('Failed to verify admin session timeout:', error);
        if (active) {
          setAccess({
            pathname,
            status: 'error',
            errorMessage: t(
              'Sesi admin belum dapat diperiksa. Periksa koneksi lalu muat ulang halaman.',
              'The admin session could not be checked. Check your connection and reload the page.',
            ),
          });
        }
      }
    };

    void verifyAccess();
    return () => { active = false; };
  }, [pathname, router, t]);

  useEffect(() => {
    if (state !== 'authorized') return;

    let active = true;
    let signOutPending = false;
    let lastActivityWriteAt = Date.now();

    const showTrackingError = (error: unknown) => {
      console.error('Failed to track admin activity:', error);
      if (active) {
        setAccess({
          pathname,
          status: 'error',
          errorMessage: t(
            'Aktivitas sesi admin belum dapat dipantau. Periksa koneksi lalu muat ulang halaman.',
            'Admin session activity could not be tracked. Check your connection and reload the page.',
          ),
        });
      }
    };

    const checkIdleTimeout = async () => {
      if (signOutPending) return;

      try {
        const now = Date.now();
        const storedLastActivity = window.localStorage.getItem(ADMIN_LAST_ACTIVITY_STORAGE_KEY);
        const lastActivityAt = storedLastActivity === null ? now : Number(storedLastActivity);
        if (storedLastActivity === null) {
          window.localStorage.setItem(ADMIN_LAST_ACTIVITY_STORAGE_KEY, String(now));
          lastActivityWriteAt = now;
          return;
        }
        if (Number.isFinite(lastActivityAt) && now - lastActivityAt < ADMIN_IDLE_TIMEOUT_MS) return;

        signOutPending = true;
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) {
          console.error('Failed to sign out idle admin:', error);
          if (active) {
            setAccess({
              pathname,
              status: 'error',
              errorMessage: t(
                'Sesi admin tidak aktif belum dapat diakhiri. Silakan coba lagi.',
                'The inactive admin session could not be ended. Please try again.',
              ),
            });
          }
          return;
        }

        try {
          window.localStorage.removeItem(ADMIN_LAST_ACTIVITY_STORAGE_KEY);
        } catch (error) {
          console.error('Failed to clear idle admin activity timestamp:', error);
        }
        if (active) {
          setAccess({ pathname, status: 'unauthorized' });
          router.replace('/admin/login');
        }
      } catch (error) {
        showTrackingError(error);
      }
    };

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastActivityWriteAt < 5_000) return;

      try {
        window.localStorage.setItem(ADMIN_LAST_ACTIVITY_STORAGE_KEY, String(now));
        lastActivityWriteAt = now;
      } catch (error) {
        showTrackingError(error);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) void checkIdleTimeout();
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== ADMIN_LAST_ACTIVITY_STORAGE_KEY) return;
      if (event.newValue === null) {
        router.replace('/admin/login');
      } else {
        void checkIdleTimeout();
      }
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    const intervalId = window.setInterval(() => void checkIdleTimeout(), 15_000);

    return () => {
      active = false;
      events.forEach((event) => window.removeEventListener(event, recordActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.clearInterval(intervalId);
    };
  }, [pathname, router, state, t]);

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
          {access.errorMessage || t('Identitas admin belum dapat diverifikasi. Periksa koneksi lalu muat ulang halaman.', 'Admin identity could not be verified. Check your connection and reload the page.')}
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
