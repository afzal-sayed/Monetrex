import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

export const useAuthSlice = ({ showToast, setIsLoading }) => {
  const [user,      setUser]      = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // ── Initial session validation via HttpOnly cookie ────────────────────────
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await apiFetch('/me');
        if (res.ok) {
          const { user: u } = await res.json();
          setUser(u);
        }
        // 401 means no valid cookie — not an error, just not logged in
      } catch {
        // Network error — don't log out, just treat as not ready
      } finally {
        setAuthReady(true);
        setIsLoading(false);
      }
    };
    validate();
  }, [setIsLoading]);

  const login = async (email, password) => {
    try {
      const res  = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Login failed' };
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot connect to server. Make sure the backend is running.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res  = await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Signup failed' };
      setUser(data.user);
      showToast(`Welcome to Monetrex, ${data.user.name}!`);
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot connect to server. Make sure the backend is running.' };
    }
  };

  const updateUser = async (updates) => {
    try {
      const res  = await apiFetch('/me', { method: 'PATCH', body: JSON.stringify(updates) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Update failed', 'error'); return false; }
      setUser(data.user);
      showToast('Profile updated!');
      return true;
    } catch {
      showToast('Failed to update profile', 'error');
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res  = await apiFetch('/me/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  return { user, setUser, authReady, login, signup, updateUser, changePassword };
};
