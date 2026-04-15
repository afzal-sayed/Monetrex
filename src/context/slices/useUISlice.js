import { useState, useEffect, useCallback } from 'react';

export const useUISlice = () => {
  const [theme,     setTheme]     = useState(() => localStorage.getItem('theme') || 'dark');
  const [toast,     setToast]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return { theme, toggleTheme, toast, showToast, isLoading, setIsLoading };
};
