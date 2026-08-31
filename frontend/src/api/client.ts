

import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export async function apiFetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (UNSAFE_METHODS.includes(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) headers.set('X-CSRFToken', csrfToken);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });
}

// Для совместимости с axios интерцепторами (если нужны)
export const apiClient = {
  get: async (url: string) => {
    const response = await apiFetch(url);
    return response.json();
  },
  post: async (url: string, data: any) => {
    const response = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  patch: async (url: string, data: any) => {
    const response = await apiFetch(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  delete: async (url: string) => {
    const response = await apiFetch(url, {
      method: 'DELETE',
    });
    return response.json();
  },
};

export default apiClient;