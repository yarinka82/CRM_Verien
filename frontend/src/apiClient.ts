

// Thin wrapper around fetch that:
// - always sends the session cookie (credentials: 'include')
// - attaches Django's CSRF token on unsafe methods

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