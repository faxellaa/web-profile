'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { setThemeWithTransition, syncThemeFromStorage, useThemeMode } from '@/lib/theme-transition';

export default function AdminLogin() {
  const { lang, setLang, t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const isDark = useThemeMode();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.add('admin-interface');
    syncThemeFromStorage();
    return () => document.documentElement.classList.remove('admin-interface');
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setThemeWithTransition(nextDark);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setErrorMsg(t('Email belum dikonfirmasi di Supabase! Buka Supabase > Auth > Users > klik Confirm.', 'Email is not confirmed in Supabase! Open Supabase > Auth > Users > click Confirm.'));
        } else if (error.message.includes('Invalid login credentials')) {
          setErrorMsg(t('Email atau kata sandi admin salah!', 'Incorrect admin email or password!'));
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
      } else if (data.session && data.user.app_metadata?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (data.session) {
        await supabase.auth.signOut();
        setErrorMsg(t(
          'Akun ini belum diberi akses admin. Hubungi pengelola Supabase sekolah.',
          'This account has not been granted admin access. Contact the school Supabase owner.',
        ));
        setLoading(false);
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : t('Terjadi kesalahan sistem', 'A system error occurred'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-500 relative">
      <div className="w-full max-w-sm sm:max-w-md ios-glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative z-10 shadow-2xl border border-white/80 dark:border-white/10 transition-colors duration-500">

        {/* Baris Atas */}
        <div className="flex items-center justify-end gap-2 border-b border-slate-200/70 pb-3 dark:border-white/10">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-300 border border-slate-200/80 dark:border-white/15 shadow-sm active:scale-90"
            title={isDark ? t("Mode Gelap", "Dark Mode") : t("Mode Terang", "Light Mode")}
            aria-label={t("Ganti Tema", "Toggle Theme")}
          >
            {isDark ? (
              <svg className="w-4 h-4 text-sky-400 fill-current" viewBox="0 0 24 24">
                <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-500 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Logo & Judul */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2.5 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center">
            <img src="/img/logosmp.png" alt={t("Logo SMP Muhammadiyah Kembaran", "SMP Muhammadiyah Kembaran Logo")} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-blue-950 dark:text-white">{t('Portal Masuk Admin', 'Admin Login Portal')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">SMP Muhammadiyah Kembaran</p>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t('Hanya akun Supabase berizin yang dapat masuk.', 'Only authorized Supabase accounts can sign in.')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-600 dark:text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              {t('Email Administrator', 'Administrator Email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Masukkan email', 'Enter email')}
              className="w-full px-4 py-3 sm:py-2.5 text-base sm:text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              {t('Password', 'Password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('Masukkan password', 'Enter password')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 sm:py-2.5 sm:text-xs"
              />
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

          <div className="-mt-1 flex justify-end">
            <Link href="/admin/lupa-password" className="text-xs font-semibold text-blue-700 dark:text-sky-400 hover:underline">
              {t('Lupa password?', 'Forgot password?')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/25 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? t('Memverifikasi...', 'Verifying...') : t('Masuk ke Dashboard', 'Go to Dashboard')}
          </button>
        </form>
      </div>
    </div>
  );
}