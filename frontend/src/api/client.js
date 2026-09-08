const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let authToken = localStorage.getItem('toko_stok_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('toko_stok_token', token);
  else localStorage.removeItem('toko_stok_token');
}

export function getAuthToken() {
  return authToken;
}

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, query, raw } = {}) {
  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (raw) return res; // for file downloads

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(data?.message || 'Terjadi kesalahan. Silakan coba lagi.', res.status, data?.details);
  }
  return data;
}

export const api = {
  get: (path, query) => request(path, { method: 'GET', query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  async download(path, query, filename) {
    const res = await request(path, { method: 'GET', query, raw: true });
    if (!res.ok) {
      let msg = 'Gagal mengunduh laporan.';
      try {
        const data = await res.json();
        msg = data?.message || msg;
      } catch (e) {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'laporan.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { ApiError };
