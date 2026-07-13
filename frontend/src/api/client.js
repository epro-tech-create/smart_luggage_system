export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8195/api';
export const AUTH_STORAGE_KEY = 'safiri_auth';

export function readStoredAuth() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function apiRequest(path, options = {}) {
  const stored = readStoredAuth();
  const token = options.authToken || stored?.token;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Backend request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
