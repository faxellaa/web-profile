'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'id' | 'en';

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (id: string, en: string) => string;
};

const STORAGE_KEY = 'site-lang';
const LangContext = createContext<LangContextValue>({ lang: 'id', setLang: () => {}, t: (id) => id });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('id');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // Dibaca setelah mount agar HTML server dan client tetap sama (hindari hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'en' || saved === 'id') setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: (id, en) => (lang === 'en' ? en : id) }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
