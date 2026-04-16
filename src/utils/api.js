export const API       = import.meta.env.VITE_API_URL || '/api';
export const GROUP_KEY = 'monetrex_active_group';

// Token is now stored in an HttpOnly cookie — not accessible from JS.
// Keep TOKEN_KEY exported for any legacy references (can be removed after cleanup).
export const TOKEN_KEY = 'monetrex_token';
export const getToken  = () => null; // deprecated — auth via cookie

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include', // send HttpOnly cookie on every request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
};
