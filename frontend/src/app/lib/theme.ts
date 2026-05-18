export type ThemeName = 'dark' | 'light';

const THEME_KEY = 'mediavault.theme.v2';

export const getStoredTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'dark';
  const theme = window.localStorage.getItem(THEME_KEY);
  return theme === 'light' ? 'light' : 'dark';
};

export const applyTheme = (theme: ThemeName) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
};

export const setStoredTheme = (theme: ThemeName) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(theme);
  return theme;
};

export const initTheme = () => {
  applyTheme(getStoredTheme());
};

export const getNextTheme = (theme: ThemeName): ThemeName => (theme === 'dark' ? 'light' : 'dark');
