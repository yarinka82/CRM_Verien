
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

  // Automatically add a CSRF token for unsafe methods
  if (UNSAFE_METHODS.includes(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  // If the request body is not FormData and Content-Type is not set manually, set JSON
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });
}

// Single Response Processing
async function handleResponse(response: Response) {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const data = await response.json();
      detail = typeof data === 'object' ? JSON.stringify(data) : data;
    } catch {
      try {
        const text = await response.text();
        if (text) detail = text;
      } catch {
        // body unavailable
      }
    }
    throw new Error(`Request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Helper for body preparation (FormData vs JSON)
function prepareBody(data: any): BodyInit | undefined {
  if (data === undefined || data === null) return undefined;
  if (data instanceof FormData || typeof data === 'string') return data;
  return JSON.stringify(data);
}

export const apiClient = {
  get: async (url: string, options?: RequestInit) => {
    const response = await apiFetch(url, { ...options, method: 'GET' });
    return handleResponse(response);
  },

  post: async (url: string, data?: any, options?: RequestInit) => {
    const response = await apiFetch(url, {
      ...options,
      method: 'POST',
      body: prepareBody(data),
    });
    return handleResponse(response);
  },

  put: async (url: string, data?: any, options?: RequestInit) => {
    const response = await apiFetch(url, {
      ...options,
      method: 'PUT',
      body: prepareBody(data),
    });
    return handleResponse(response);
  },

  patch: async (url: string, data?: any, options?: RequestInit) => {
    const response = await apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: prepareBody(data),
    });
    return handleResponse(response);
  },

  delete: async (url: string, options?: RequestInit) => {
    const response = await apiFetch(url, { ...options, method: 'DELETE' });
    return handleResponse(response);
  },
};

export default apiClient;