export const API       = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const TOKEN_KEY = 'monetrex_token';
export const GROUP_KEY = 'monetrex_active_group';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res;
};
