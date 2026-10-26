'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { setThemeWithTransition, syncThemeFromStorage, useThemeMode } from '@/lib/theme-transition';

const links = [
  { href: '/', label: 'Home', en: 'Home' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [academicMenuOpen, setAcademicMenuOpen] = useState(false);
  const [publicServicesMenuOpen, setPublicServicesMenuOpen] = useState(false);
  const [galleryMenuOpen, setGalleryMenuOpen] = useState(false);
  const [informationMenuOpen, setInformationMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const darkMode = useThemeMode();
  const { lang, setLang, t } = useLang();
  const [isScrolled, setIsScrolled] = useState(false);
  const isProfileActive = pathname.startsWith('/profil') || pathname.startsWith('/guru');
  const isAcademicActive = pathname.startsWith('/prestasi') || pathname.startsWith('/akademik');
  const isPublicServicesActive = pathname.startsWith('/layanan-publik');
  const isGalleryActive = pathname.startsWith('/galeri');
  const isInformationActive = pathname === '/kontak';

  useEffect(() => {
    if (!profileMenuOpen && !academicMenuOpen && !publicServicesMenuOpen && !galleryMenuOpen && !informationMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
        setAcademicMenuOpen(false);
        setPublicServicesMenuOpen(false);
        setGalleryMenuOpen(false);
        setInformationMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setAcademicMenuOpen(false);
        setPublicServicesMenuOpen(false);
        setGalleryMenuOpen(false);
        setInformationMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [academicMenuOpen, galleryMenuOpen, informationMenuOpen, profileMenuOpen, publicServicesMenuOpen]);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const syncTheme = () => {
      syncThemeFromStorage();
    };

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const themeFrame = window.requestAnimationFrame(syncTheme);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(themeFrame);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    setThemeWithTransition(nextDarkMode);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setAcademicMenuOpen(false);
    setPublicServicesMenuOpen(false);
    setGalleryMenuOpen(false);
    setInformationMenuOpen(false);
  };
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-2 z-50 flex justify-center px-3 transition-all duration-300 sm:top-3 sm:px-6">
      <nav ref={navRef} className={`w-full max-w-6xl border border-slate-200/80 shadow-lg shadow-blue-950/5 backdrop-blur-xl transition-all duration-300 dark:border-white/10 ${mobileMenuOpen ? 'rounded-3xl bg-white/95 px-4 py-3 dark:bg-slate-900/95 sm:px-6' : `rounded-full px-4 py-2 sm:px-6 ${isScrolled ? 'bg-white/90 dark:bg-slate-900/90' : 'bg-white/75 dark:bg-slate-900/75'}`}`}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/" onClick={closeMobileMenu} className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm transition-colors group-hover:border-blue-300 dark:border-white/10 dark:bg-slate-800 dark:group-hover:border-sky-300/30 sm:h-10 sm:w-10">
              <img src="/img/logosmp.png" alt="Logo SMP Muhammadiyah Kembaran" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold leading-tight text-blue-950 dark:text-white sm:text-sm">SMP Muhammadiyah</span>
              <span className="block truncate text-[10px] font-semibold text-blue-600 dark:text-sky-400 sm:text-[11px]">Kembaran, Banyumas</span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 lg:flex">
            {links.slice(0, 1).map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMobileMenu} aria-current={isActive(link.href) ? 'page' : undefined} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition-colors ${isActive(link.href) ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                {lang === 'en' ? link.en : link.label}
              </Link>
            ))}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAcademicMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen(false);
                  setProfileMenuOpen((open) => !open);
                }}
                aria-expanded={profileMenuOpen}
                aria-controls="profile-submenu-desktop"
                className={`flex items-center gap-1 rounded-full px-3 py-2 whitespace-nowrap transition-colors ${isProfileActive ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}
              >
                {t('Profil', 'About')}
                <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && (
                <div id="profile-submenu-desktop" className="nav-dropdown absolute left-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-200">
                  <Link href="/profil" onClick={closeMobileMenu} aria-current={pathname === '/profil' ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname === '/profil' ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Profil Sekolah', 'School Profile')}
                  </Link>
                  <Link href="/profil/sarana-prasarana" onClick={closeMobileMenu} aria-current={pathname === '/profil/sarana-prasarana' ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname === '/profil/sarana-prasarana' ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Sarana & Prasarana', 'Facilities')}
                  </Link>
                  <Link href="/guru" onClick={closeMobileMenu} aria-current={pathname.startsWith('/guru') ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname.startsWith('/guru') ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Tenaga Kerja', 'Staff')}
                  </Link>
                </div>
              )}
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen(false);
                  setAcademicMenuOpen((open) => !open);
                }}
                aria-expanded={academicMenuOpen}
                aria-controls="academic-submenu-desktop"
                className={`flex items-center gap-1 rounded-full px-3 py-2 whitespace-nowrap transition-colors ${isAcademicActive ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}
              >
                {t('Akademik', 'Academics')}
                <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${academicMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {academicMenuOpen && (
                <div id="academic-submenu-desktop" className="nav-dropdown absolute left-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-200">
                  <Link href="/prestasi" onClick={closeMobileMenu} aria-current={pathname.startsWith('/prestasi') ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname.startsWith('/prestasi') ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Prestasi', 'Achievements')}
                  </Link>
                  <Link href="/akademik/ekstrakurikuler" onClick={closeMobileMenu} aria-current={pathname.startsWith('/akademik/ekstrakurikuler') ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname.startsWith('/akademik/ekstrakurikuler') ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Ekstrakurikuler', 'Extracurriculars')}
                  </Link>
                </div>
              )}
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setAcademicMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setInformationMenuOpen(false);
                  setGalleryMenuOpen((open) => !open);
                }}
                aria-expanded={galleryMenuOpen}
                aria-controls="gallery-submenu-desktop"
                className={`flex items-center gap-1 rounded-full px-3 py-2 whitespace-nowrap transition-colors ${isGalleryActive ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}
              >
                {t('Galeri', 'Gallery')}
                <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${galleryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {galleryMenuOpen && (
                <div id="gallery-submenu-desktop" className="nav-dropdown absolute left-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-200">
                  <Link href="/galeri/foto" onClick={closeMobileMenu} aria-current={pathname.startsWith('/galeri/foto') ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname.startsWith('/galeri/foto') ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Foto', 'Photos')}
                  </Link>
                  <Link href="/galeri/video" onClick={closeMobileMenu} aria-current={pathname.startsWith('/galeri/video') ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname.startsWith('/galeri/video') ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Video', 'Videos')}
                  </Link>
                </div>
              )}
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setAcademicMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen(false);
                  setPublicServicesMenuOpen((open) => !open);
                }}
                aria-expanded={publicServicesMenuOpen}
                aria-controls="public-services-submenu-desktop"
                className={`flex items-center gap-1 rounded-full px-3 py-2 whitespace-nowrap transition-colors ${isPublicServicesActive ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}
              >
                {t('Layanan Publik', 'Public Services')}
                <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${publicServicesMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {publicServicesMenuOpen && (
                <div id="public-services-submenu-desktop" className="nav-dropdown absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-200">
                  <Link href="/layanan-publik/spmb-online" onClick={closeMobileMenu} aria-current={pathname.startsWith('/layanan-publik/spmb-online') ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname.startsWith('/layanan-publik/spmb-online') ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('SPMB Online', 'Online Admission')}
                  </Link>
                  <Link href="/layanan-publik/surat-masuk" onClick={closeMobileMenu} aria-current={pathname.startsWith('/layanan-publik/surat-masuk') ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${pathname.startsWith('/layanan-publik/surat-masuk') ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Kirim Surat Masuk', 'Submit Incoming Mail')}
                  </Link>
                </div>
              )}
            </div>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setAcademicMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen((open) => !open);
                }}
                aria-expanded={informationMenuOpen}
                aria-controls="information-submenu-desktop"
                className={`flex items-center gap-1 rounded-full px-3 py-2 whitespace-nowrap transition-colors ${isInformationActive ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}
              >
                {t('Informasi', 'Information')}
                <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${informationMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {informationMenuOpen && (
                <div id="information-submenu-desktop" className="nav-dropdown absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-slate-700 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-200">
                  <Link href="/kontak" onClick={closeMobileMenu} aria-current={pathname === '/kontak' ? 'page' : undefined} className={`block px-3 py-2.5 text-left transition-colors ${isInformationActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400'}`}>
                    {t('Kontak', 'Contact')}
                  </Link>
                  <Link href="/admin/login" onClick={closeMobileMenu} className="block px-3 py-2.5 text-left transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800 dark:hover:text-sky-400">
                    {t('Masuk Admin', 'Admin Login')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 shadow-sm transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-10 sm:w-10" title={darkMode ? t('Beralih ke Mode Terang', 'Switch to Light Mode') : t('Beralih ke Mode Gelap', 'Switch to Dark Mode')} aria-label={darkMode ? t('Beralih ke Mode Terang', 'Switch to Light Mode') : t('Beralih ke Mode Gelap', 'Switch to Dark Mode')}>
              {darkMode ? <Moon className="h-4 w-4 text-sky-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </button>
            <button type="button" onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="flex h-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:h-10" aria-label={t('Ganti bahasa ke Inggris', 'Switch language to Indonesian')} title={t('Switch to English', 'Ganti ke Bahasa Indonesia')}>
              {lang === 'id' ? 'ID' : 'EN'}
            </button>
            <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200 lg:hidden" aria-label={mobileMenuOpen ? t('Tutup menu', 'Close menu') : t('Buka menu', 'Open menu')} aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="nav-mobile-panel mt-3 flex flex-col gap-1 border-t border-slate-200/80 pt-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200 lg:hidden">
            {links.slice(0, 1).map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMobileMenu} aria-current={isActive(link.href) ? 'page' : undefined} className={`rounded-xl px-3 py-2 transition-colors ${isActive(link.href) ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}>
                {lang === 'en' ? link.en : link.label}
              </Link>
            ))}
            <div>
              <button
                type="button"
                onClick={() => {
                  setAcademicMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen(false);
                  setProfileMenuOpen((open) => !open);
                }}
                aria-expanded={profileMenuOpen}
                aria-controls="profile-submenu-mobile"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${isProfileActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}
              >
                {t('Profil', 'About')}
                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && (
                <div id="profile-submenu-mobile" className="ml-3 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-white/10">
                  <Link href="/profil" onClick={closeMobileMenu} aria-current={pathname === '/profil' ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Profil Sekolah', 'School Profile')}
                  </Link>
                  <Link href="/profil/sarana-prasarana" onClick={closeMobileMenu} aria-current={pathname === '/profil/sarana-prasarana' ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Sarana & Prasarana', 'Facilities')}
                  </Link>
                  <Link href="/guru" onClick={closeMobileMenu} aria-current={pathname.startsWith('/guru') ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Tenaga Kerja', 'Staff')}
                  </Link>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen(false);
                  setAcademicMenuOpen((open) => !open);
                }}
                aria-expanded={academicMenuOpen}
                aria-controls="academic-submenu-mobile"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${isAcademicActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}
              >
                {t('Akademik', 'Academics')}
                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${academicMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {academicMenuOpen && (
                <div id="academic-submenu-mobile" className="ml-3 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-white/10">
                  <Link href="/prestasi" onClick={closeMobileMenu} aria-current={pathname.startsWith('/prestasi') ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Prestasi', 'Achievements')}
                  </Link>
                  <Link href="/akademik/ekstrakurikuler" onClick={closeMobileMenu} aria-current={pathname.startsWith('/akademik/ekstrakurikuler') ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Ekstrakurikuler', 'Extracurriculars')}
                  </Link>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setAcademicMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setInformationMenuOpen(false);
                  setGalleryMenuOpen((open) => !open);
                }}
                aria-expanded={galleryMenuOpen}
                aria-controls="gallery-submenu-mobile"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${isGalleryActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}
              >
                {t('Galeri', 'Gallery')}
                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${galleryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {galleryMenuOpen && (
                <div id="gallery-submenu-mobile" className="ml-3 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-white/10">
                  <Link href="/galeri/foto" onClick={closeMobileMenu} aria-current={pathname.startsWith('/galeri/foto') ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Foto', 'Photos')}
                  </Link>
                  <Link href="/galeri/video" onClick={closeMobileMenu} aria-current={pathname.startsWith('/galeri/video') ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Video', 'Videos')}
                  </Link>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setAcademicMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen(false);
                  setPublicServicesMenuOpen((open) => !open);
                }}
                aria-expanded={publicServicesMenuOpen}
                aria-controls="public-services-submenu-mobile"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${isPublicServicesActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}
              >
                {t('Layanan Publik', 'Public Services')}
                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${publicServicesMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {publicServicesMenuOpen && (
                <div id="public-services-submenu-mobile" className="ml-3 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-white/10">
                  <Link href="/layanan-publik/spmb-online" onClick={closeMobileMenu} aria-current={pathname.startsWith('/layanan-publik/spmb-online') ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('SPMB Online', 'Online Admission')}
                  </Link>
                  <Link href="/layanan-publik/surat-masuk" onClick={closeMobileMenu} aria-current={pathname.startsWith('/layanan-publik/surat-masuk') ? 'page' : undefined} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Kirim Surat Masuk', 'Submit Incoming Mail')}
                  </Link>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setAcademicMenuOpen(false);
                  setPublicServicesMenuOpen(false);
                  setGalleryMenuOpen(false);
                  setInformationMenuOpen((open) => !open);
                }}
                aria-expanded={informationMenuOpen}
                aria-controls="information-submenu-mobile"
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${isInformationActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}
              >
                {t('Informasi', 'Information')}
                <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${informationMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {informationMenuOpen && (
                <div id="information-submenu-mobile" className="ml-3 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-3 dark:border-white/10">
                  <Link href="/kontak" onClick={closeMobileMenu} aria-current={isInformationActive ? 'page' : undefined} className={`rounded-lg px-3 py-2 transition-colors ${isInformationActive ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-400' : 'hover:bg-blue-50 dark:hover:bg-slate-800'}`}>
                    {t('Kontak', 'Contact')}
                  </Link>
                  <Link href="/admin/login" onClick={closeMobileMenu} className="rounded-lg px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800">
                    {t('Masuk Admin', 'Admin Login')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
