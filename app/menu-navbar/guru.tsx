'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { DEFAULT_TEACHERS, type SchoolTeacher } from '@/lib/school-content';

const isStaffRole = (role: string) => /(staff|staf|tata usaha|tenaga kependidikan)/i.test(role);
const isHead = (role: string) => /kepala sekolah/i.test(role);

type Filter = 'semua' | 'guru' | 'tenaga' | 'kepala';

const ROLE_WORDS: [RegExp, string][] = [
  [/Kepala Sekolah/gi, 'Headmaster'],
  [/Wakil Kepala/gi, 'Vice Principal'],
  [/Tata Usaha/gi, 'Administration Staff'],
  [/Tenaga Kependidikan/gi, 'Education Staff'],
  [/Guru/gi, 'Teacher'],
  [/Staf(f)?/gi, 'Staff'],
  [/Bahasa Indonesia/gi, 'Indonesian'],
  [/Bahasa Inggris/gi, 'English'],
  [/Bahasa Jawa/gi, 'Javanese'],
  [/Bahasa Arab/gi, 'Arabic'],
  [/Matematika/gi, 'Mathematics'],
  [/IPA/g, 'Science'],
  [/IPS/g, 'Social Studies'],
  [/PKn/g, 'Civics'],
  [/Informatika/gi, 'Informatics'],
  [/Seni Budaya/gi, 'Arts & Culture'],
  [/Penjas|PJOK/gi, 'Physical Education'],
  [/Ismuba/gi, 'Ismuba'],
];

const translateRole = (role: string) => ROLE_WORDS.reduce((text, [pattern, en]) => text.replace(pattern, en), role);

const FILTERS: { key: Filter; label: string; en: string }[] = [
  { key: 'semua', label: 'Semua', en: 'All' },
  { key: 'kepala', label: 'Kepala Sekolah', en: 'Headmaster' },
  { key: 'guru', label: 'Guru', en: 'Teachers' },
  { key: 'tenaga', label: 'Tenaga Kependidikan', en: 'Education Staff' },
];

function Avatar({ person, className = '' }: { person: SchoolTeacher; className?: string }) {
  return person.photo_url ? (
    <img src={person.photo_url} alt={`Foto ${person.name}`} className={`h-full w-full object-cover object-top ${className}`} />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-200/70 via-white to-violet-200/60 text-7xl font-black text-slate-500 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-400">
      {person.name.charAt(0)}
    </div>
  );
}

function PersonCard({ person, index, active, onToggle }: { person: SchoolTeacher; index: number; active: boolean; onToggle: () => void }) {
  const { lang } = useLang();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      style={{ animationDelay: `${Math.min(index, 10) * 60}ms` } as CSSProperties}
      className={`rise-in group relative block overflow-hidden border text-left backdrop-blur-2xl transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white ${
        active
          ? 'border-slate-900/40 bg-slate-900/15 shadow-[0_24px_60px_-28px_rgba(30,41,59,0.6)] dark:border-white/40 dark:bg-white/20'
          : 'border-white/70 bg-white/45 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.45)] hover:bg-white/65 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]'
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-200 dark:bg-slate-900">
        <Avatar person={person} />
                <span className="absolute left-3 top-3 border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-800 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200">
          {lang === 'en' ? translateRole(person.role) : person.role}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-white/85 p-4 text-slate-950 backdrop-blur-md dark:bg-slate-950/85 dark:text-white">
          <h3 className="text-base font-black leading-tight sm:text-lg">{person.name}</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/80">{person.title || 'SMP Muhammadiyah Kembaran'}</p>
        </div>
      </div>
    </button>
  );
}

export default function GuruPage() {
  const { lang, t } = useLang();
  const [people, setPeople] = useState<SchoolTeacher[]>(DEFAULT_TEACHERS);
  const [filter, setFilter] = useState<Filter>('semua');
  const [query, setQuery] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const keyOf = (p: SchoolTeacher) => p.id || p.name;

  useEffect(() => {
    supabase.from('teachers').select('*').order('sort_order').order('name').then(({ data, error }) => {
      if (!error && data?.length) setPeople(data);
    });
  }, []);

  const head = people.find((p) => isHead(p.role));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (filter === 'kepala') return p === head && (!q || `${p.name} ${p.title ?? ''} ${p.role}`.toLowerCase().includes(q));
      if (filter === 'semua') return !q || `${p.name} ${p.title ?? ''} ${p.role}`.toLowerCase().includes(q);
      if (p === head) return false;
      if (filter === 'guru' && isStaffRole(p.role)) return false;
      if (filter === 'tenaga' && !isStaffRole(p.role)) return false;
      return !q || `${p.name} ${p.title ?? ''} ${p.role}`.toLowerCase().includes(q);
    });
  }, [people, filter, query, head]);


  return (
    <div className="relative overflow-hidden bg-linear-to-b from-slate-100 via-slate-50 to-sky-100/70 dark:from-[#050816] dark:via-[#0a1024] dark:to-[#07101f]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-indigo-600/20" />
        <div className="absolute -right-24 top-[28rem] h-[28rem] w-[28rem] rounded-full bg-violet-300/30 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute left-1/3 top-[70rem] h-96 w-96 rounded-full bg-teal-200/40 blur-3xl dark:bg-blue-500/15" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-32 sm:pt-36">
        <div className="sticky top-20 z-30 mb-8 flex flex-col gap-3 border border-white/70 bg-white/60 p-3 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label={t('Filter personel', 'Staff filter')} className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  filter === f.key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {lang === 'en' ? f.en : f.label}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-64">
            <span className="sr-only">{t('Cari nama', 'Search name')}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Cari nama atau jabatan…', 'Search name or position…')}
              className="w-full border border-white/70 bg-white/60 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur focus:outline-2 focus:outline-slate-900/40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:outline-white/40"
            />
          </label>
        </div>

        {visible.length ? (
          <section key={`${filter}-${query}`} aria-label={t('Daftar personel', 'Staff list')} className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {visible.map((p, i) => (
              <PersonCard key={p.id || p.name} person={p} index={i} active={activeKey === keyOf(p)} onToggle={() => setActiveKey((k) => (k === keyOf(p) ? null : keyOf(p)))} />
            ))}
          </section>
        ) : (
          <p className="border border-white/70 bg-white/50 p-10 text-center text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-400">{t('Tidak ada hasil yang cocok.', 'No matching results.')}</p>
        )}
      </main>

    </div>
  );
}
