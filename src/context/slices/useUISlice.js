import { useState, useEffect, useCallback } from 'react';

export const useUISlice = () => {
  const [theme,     setTheme]     = useState(() => localStorage.getItem('theme') || 'dark');
  const [toasts,    setToasts]    = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync theme across browser tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'theme' && e.newValue && e.newValue !== theme) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random(); // unique even for rapid calls
    setToasts((prev) => {
      const next = [...prev, { message, type, id }];
      return next.slice(-3); // keep newest 3
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return { theme, toggleTheme, toasts, showToast, isLoading, setIsLoading };
};
