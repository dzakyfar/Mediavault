import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'id' | 'en';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: <T>(idText: T, enText: T) => T;
}

const STORAGE_KEY = 'mediavault_language';
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const readStoredLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'id';
  return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'id';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'id';
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage(nextLanguage) {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
      setLanguageState(nextLanguage);
    },
    t(idText, enText) {
      return language === 'en' ? enText : idText;
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage harus dipakai di dalam LanguageProvider');
  }

  return context;
}
