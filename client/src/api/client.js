const TOKEN_KEY = 'sms_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('sms:unauthorized'));
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const err = new Error(data?.error || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const http = {
  get: (p) => api(p),
  post: (p, body) => api(p, { method: 'POST', body }),
  put: (p, body) => api(p, { method: 'PUT', body }),
  del: (p) => api(p, { method: 'DELETE' }),
};
