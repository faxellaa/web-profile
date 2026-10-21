import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LanguageProvider } from '@/lib/i18n';
import PageViewTracker from './components/PageViewTracker';

export const metadata: Metadata = {
  title: 'SMP Muhammadiyah Kembaran - Banyumas',
  description: 'Portal Profil Resmi SMP Muhammadiyah Kembaran dengan Kurikulum Berkemajuan dan Karakter Islami.',
  icons: {
    icon: '/img/logosmp.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col relative transition-colors duration-300" suppressHydrationWarning>
        <LanguageProvider>
          <PageViewTracker />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}