export const API       = import.meta.env.VITE_API_URL || '/api';
export const GROUP_KEY = 'monetrex_active_group';

export const TOKEN_KEY = 'monetrex_token';
export const getToken  = () => localStorage.getItem(TOKEN_KEY);

// ── CSRF token (Double Submit Cookie pattern) ────────────────────────────────
let _csrfToken = null;

export const fetchCsrfToken = async () => {
  const res  = await fetch(`${API}/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  _csrfToken = data.token;
  return _csrfToken;
};

export const apiFetch = async (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  // Lazy-fetch the token on first mutating request
  if (needsCsrf && !_csrfToken) await fetchCsrfToken();

  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(needsCsrf ? { 'x-csrf-token': _csrfToken } : {}),
      ...options.headers,
    },
  });

  // If the CSRF token expired, refresh once and retry
  if (res.status === 403 && needsCsrf) {
    await fetchCsrfToken();
    return fetch(`${API}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': _csrfToken,
        ...options.headers,
      },
    });
  }

  return res;
};
