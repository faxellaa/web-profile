'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { syncThemeFromStorage } from '@/lib/theme-transition';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

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
    'w-full px-4 py-3 sm:py-2.5 text-base sm:text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
      <button type="button" onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-[11px] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:bg-white active:scale-90 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:right-5 sm:top-5" title={t('Switch to English', 'Ganti ke Bahasa Indonesia')} aria-label={t('Ganti Bahasa', 'Change Language')}>{lang === 'id' ? 'ID' : 'EN'}</button>
      <div className="w-full max-w-sm sm:max-w-md ios-glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative z-10 shadow-2xl border border-white/80 dark:border-white/10">
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
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('Masukkan password baru', 'Enter new password')} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('Konfirmasi Password', 'Confirm Password')}</label>
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('Ulangi password baru', 'Repeat new password')} className={inputClass} />
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
