'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { syncThemeFromStorage } from '@/lib/theme-transition';

export default function LupaPasswordPage() {
  const { lang, setLang, t } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('admin-interface');
    syncThemeFromStorage();
    return () => document.documentElement.classList.remove('admin-interface');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
      <button type="button" onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-[11px] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:bg-white active:scale-90 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:right-5 sm:top-5" title={t('Switch to English', 'Ganti ke Bahasa Indonesia')} aria-label={t('Ganti Bahasa', 'Change Language')}>{lang === 'id' ? 'ID' : 'EN'}</button>
      <div className="w-full max-w-sm sm:max-w-md ios-glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative z-10 shadow-2xl border border-white/80 dark:border-white/10">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2.5 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center">
            <img src="/img/logosmp.png" alt={t("Logo SMP Muhammadiyah Kembaran", "SMP Muhammadiyah Kembaran Logo")} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-blue-950 dark:text-white">{t('Lupa Password', 'Forgot Password')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('Masukkan email admin, kami akan mengirim tautan untuk mengatur ulang password.', 'Enter the admin email and we will send a link to reset your password.')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-600 dark:text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {sent ? (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs text-center font-medium">
            {t(`Tautan reset password telah dikirim ke ${email}. Cek inbox atau folder spam.`, `A password reset link has been sent to ${email}. Check your inbox or spam folder.`)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('Email', 'Email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('Masukkan email', 'Enter email')}
                className="w-full px-4 py-3 sm:py-2.5 text-base sm:text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/25 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? t('Mengirim...', 'Sending...') : t('Kirim Tautan Reset', 'Send Reset Link')}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link href="/admin/login" className="text-xs font-semibold text-blue-700 dark:text-sky-400 hover:underline">
            {t('Kembali ke login', 'Back to login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
