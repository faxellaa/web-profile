'use client';

import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { setThemeWithTransition, syncThemeFromStorage, useThemeMode } from '@/lib/theme-transition';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);
  const isDark = useThemeMode();

  useEffect(() => {
    document.documentElement.classList.add('admin-interface');
    syncThemeFromStorage();

    // Supabase membuat sesi recovery otomatis dari tautan email
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });

    return () => {
      sub.subscription.unsubscribe();
      document.documentElement.classList.remove('admin-interface');
    };
  }, []);

  const toggleTheme = () => {
    setThemeWithTransition(!isDark);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) return setErrorMsg(t('Password minimal 6 karakter.', 'Password must be at least 6 characters.'));
    if (password !== confirm) return setErrorMsg(t('Konfirmasi password tidak sama.', 'Password confirmation does not match.'));

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return setErrorMsg(error.message);
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push('/admin/login'), 2000);
  };

  const inputClass =
    'w-full px-4 pr-12 py-3 sm:py-2.5 text-base sm:text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-500 relative">
      <div className="w-full max-w-sm sm:max-w-md ios-glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative z-10 shadow-2xl border border-white/80 dark:border-white/10 transition-colors duration-500">
        <div className="flex items-center justify-end gap-2 border-b border-slate-200/70 pb-3 dark:border-white/10">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 shadow-sm transition-all duration-300 hover:bg-white active:scale-90 dark:border-white/15 dark:bg-slate-800 dark:hover:bg-slate-700"
            title={isDark ? t('Mode Gelap', 'Dark Mode') : t('Mode Terang', 'Light Mode')}
            aria-label={t('Ganti Tema', 'Toggle Theme')}
          >
            {isDark ? (
              <svg className="h-4 w-4 fill-current text-sky-400" viewBox="0 0 24 24">
                <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 stroke-current text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title={lang === 'id' ? 'Ganti ke Bahasa Inggris' : 'Switch to Indonesian'}
            aria-label={t('Ganti Bahasa', 'Change Language')}
          >
            {lang === 'id' ? 'ID' : 'EN'}
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2.5 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center">
            <img src="/img/logosmp.png" alt={t("Logo SMP Muhammadiyah Kembaran", "SMP Muhammadiyah Kembaran Logo")} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-blue-950 dark:text-white">{t('Atur Ulang Password', 'Reset Password')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Masukkan password baru untuk akun admin.', 'Enter a new password for the admin account.')}</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-600 dark:text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {done ? (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs text-center font-medium">
            {t('Password berhasil diubah. Mengarahkan ke halaman login...', 'Password changed successfully. Redirecting to the login page...')}
          </div>
        ) : !ready ? (
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            {t('Tautan tidak valid atau kedaluwarsa. Silakan', 'The link is invalid or has expired. Please')}{' '}
            <Link href="/admin/lupa-password" className="font-semibold text-blue-700 dark:text-sky-400 hover:underline">
              {t('minta tautan baru', 'request a new link')}
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('Password Baru', 'New Password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('Masukkan password baru', 'Enter new password')} className={inputClass} />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t('Sembunyikan password', 'Hide password') : t('Tampilkan password', 'Show password')}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-sky-400"
                >
                  {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('Konfirmasi Password', 'Confirm Password')}</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('Ulangi password baru', 'Repeat new password')} className={inputClass} />
                <button
                  type="button"
                  onClick={() => setShowConfirm((visible) => !visible)}
                  aria-label={showConfirm ? t('Sembunyikan password', 'Hide password') : t('Tampilkan password', 'Show password')}
                  aria-pressed={showConfirm}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-sky-400"
                >
                  {showConfirm ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/25 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? t('Menyimpan...', 'Saving...') : t('Simpan Password Baru', 'Save New Password')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
