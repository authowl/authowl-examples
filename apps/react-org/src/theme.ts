import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function current(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Theme lives on <html data-theme>; the inline script in index.html sets it first. */
export function useThemeToggle(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('owl-theme', theme);
    } catch {
      // Private mode, or storage disabled: the theme just won't persist.
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((value) => (value === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggle };
}
