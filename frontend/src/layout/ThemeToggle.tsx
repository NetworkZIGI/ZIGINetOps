import { useEffect } from 'react';
import { create } from 'zustand';

type ThemeState = {
  theme: 'light' | 'dark';
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggle: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="theme-switch">
      <button
        className={theme === 'light' ? 'theme-option active' : 'theme-option'}
        onClick={() => theme === 'dark' && toggle()}
        type="button"
      >
        Light
      </button>
      <button
        className={theme === 'dark' ? 'theme-option active' : 'theme-option'}
        onClick={() => theme === 'light' && toggle()}
        type="button"
      >
        Dark
      </button>
    </div>
  );
}
