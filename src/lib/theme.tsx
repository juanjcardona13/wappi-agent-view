import { useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
const key = 'wappi-view-theme';

export function resolveDark(choice: ThemeChoice): boolean {
  if (choice === 'dark') return true;
  if (choice === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(choice: ThemeChoice) {
  const dark = resolveDark(choice);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  useEffect(() => {
    applyTheme(choice);
    localStorage.setItem(key, choice);
    if (choice !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [choice]);

  const cycle = () => setChoice((current) => (current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system'));
  const label = choice === 'system' ? 'Tema: sistema' : choice === 'dark' ? 'Tema: oscuro' : 'Tema: claro';
  return { choice, cycle, label };
}
