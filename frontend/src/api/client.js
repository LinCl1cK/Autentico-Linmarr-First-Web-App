import axios from 'axios';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user, persist = true) {
  clearSession();

  if (token) {
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

// Replaces only the cached user (keeps the token), e.g. after editing the profile
export function updateStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export function getApiErrorMessage(error, fallback) {
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    const fieldMessages = Object.values(data).filter(
      (value) => typeof value === 'string' && value.trim()
    );

    if (fieldMessages.length > 0) {
      return fieldMessages.join(' ');
    }
  }

  return fallback;
}

export default apiClient;
