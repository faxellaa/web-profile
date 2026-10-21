import { useSyncExternalStore } from 'react';

const themeListeners = new Set<() => void>();
let themeTransitionTimer: number | undefined;

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function updateThemeFromStorage() {
  document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
  notifyThemeListeners();
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);
  window.addEventListener('storage', updateThemeFromStorage);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener('storage', updateThemeFromStorage);
  };
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains('dark');
}

export function useThemeMode() {
  return useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);
}

export function syncThemeFromStorage() {
  updateThemeFromStorage();
}

export function setThemeWithTransition(isDark: boolean) {
  const root = document.documentElement;
  const applyTheme = () => {
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    notifyThemeListeners();
  };

  if (themeTransitionTimer) window.clearTimeout(themeTransitionTimer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('theme-transition');
    applyTheme();
    return;
  }

  root.classList.add('theme-transition');
  applyTheme();
  themeTransitionTimer = window.setTimeout(() => {
    root.classList.remove('theme-transition');
    themeTransitionTimer = undefined;
  }, 420);
}