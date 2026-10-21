'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { setThemeWithTransition, syncThemeFromStorage, useThemeMode } from '@/lib/theme-transition';

export default function AdminNavbar() {
  const { lang, setLang, t } = useLang();
  const links = [
    { href: '/admin/dashboard', label: t('Dashboard', 'Dashboard') },
    { href: '/admin/spmb', label: t('Pendaftar SPMB', 'SPMB Applicants') },
    { href: '/admin/galeri', label: t('Galeri Foto & Video', 'Photo & Video Gallery') },
    { href: '/admin/berita', label: t('Berita', 'News') },
    { href: '/admin/guru-staff', label: t('Data Guru & Staff', 'Teacher & Staff Data') },
    { href: '/admin/ekstrakulikuler', label: t('Ekstrakulikuler', 'Extracurriculars') },
    { href: '/admin/sarana-prasarana', label: t('Sarana & Prasarana', 'Facilities') },
  ];
  const pathname = usePathname();
  const router = useRouter();
  const isDark = useThemeMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('admin-interface');
    syncThemeFromStorage();
    return () => document.documentElement.classList.remove('admin-interface');
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setThemeWithTransition(nextDark);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const isActive = (href: string) => href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-2 z-50 flex justify-center px-3 sm:top-3 sm:px-6">
      <nav className={`w-full max-w-6xl border border-slate-200/80 shadow-lg shadow-blue-950/5 transition-all duration-300 dark:border-white/10 ${mobileMenuOpen ? 'rounded-3xl bg-white/95 px-4 py-3 backdrop-blur-2xl dark:bg-slate-900/95 sm:px-6' : 'rounded-full bg-white/85 px-4 py-2.5 backdrop-blur-xl dark:bg-slate-900/85 sm:px-6'}`}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin/dashboard" onClick={closeMobileMenu} className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm transition-colors group-hover:border-blue-300 dark:border-white/10 dark:bg-slate-800 dark:group-hover:border-sky-300/30 sm:h-10 sm:w-10">
              <img src="/img/logosmp.png" alt={t('Logo SMP Muhammadiyah Kembaran', 'SMP Muhammadiyah Kembaran Logo')} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-bold leading-tight text-blue-950 dark:text-white sm:text-sm">{t('Admin SMP Muhammadiyah', 'SMP Muhammadiyah Admin')}</span>
              <span className="block truncate text-[10px] font-semibold tracking-wide text-blue-600 dark:text-sky-400 sm:text-[11px]">Kembaran, Banyumas</span>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 xl:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition-all duration-200 active:scale-95 ${isActive(link.href) ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-200 hover:bg-slate-100 active:scale-90 dark:border-white/15 dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-10 sm:w-10" title={isDark ? t('Beralih ke Mode Terang', 'Switch to Light Mode') : t('Beralih ke Mode Gelap', 'Switch to Dark Mode')} aria-label={t('Ganti Tema', 'Toggle Theme')}>
              {isDark ? <svg className="h-4 w-4 fill-current text-sky-400" viewBox="0 0 24 24"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg> : <svg className="h-4 w-4 stroke-current text-amber-500" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l1.41-1.41" /></svg>}
            </button>
            <button type="button" onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-[11px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-100 active:scale-90 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:h-10 sm:w-10" title={t('Switch to English', 'Ganti ke Bahasa Indonesia')} aria-label={t('Ganti Bahasa', 'Change Language')}>{lang === 'id' ? 'ID' : 'EN'}</button>
            <Link href="/" target="_blank" className="hidden rounded-full px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-sky-400 sm:inline-flex">{t('Lihat Web', 'View Site')}</Link>
            <button type="button" onClick={logout} className="hidden rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95 sm:inline-flex">{t('Keluar', 'Logout')}</button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-2xl bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 xl:hidden" aria-label={mobileMenuOpen ? t('Tutup Menu', 'Close Menu') : t('Buka Menu', 'Open Menu')} aria-expanded={mobileMenuOpen}><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />}</svg></button>
          </div>
        </div>

        {mobileMenuOpen && <div className="nav-mobile-panel mt-3 flex max-h-[min(70vh,34rem)] flex-col gap-1 overflow-y-auto border-t border-slate-200/80 pt-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200 xl:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={closeMobileMenu} className={`rounded-xl px-3 py-2 transition-colors ${isActive(link.href) ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}>{link.label}</Link>)}
          <Link href="/" target="_blank" onClick={closeMobileMenu} className="rounded-xl px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800">{t('Lihat Web', 'View Site')}</Link>
          <button type="button" onClick={logout} className="rounded-xl px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">{t('Keluar', 'Logout')}</button>
        </div>}
      </nav>
    </header>
  );
}
