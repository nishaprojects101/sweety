const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'sweety_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors; // [{ field, message }]
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is it running?', 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.', res.status, data.errors);
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  listReadings: (page = 1, limit = 10) => request(`/readings?page=${page}&limit=${limit}`),
  addReading: (body) => request('/readings', { method: 'POST', body }),
  updateReading: (id, body) => request(`/readings/${id}`, { method: 'PUT', body }),
  deleteReading: (id) => request(`/readings/${id}`, { method: 'DELETE' }),
  report: (type, date) => request(`/reports/${type}?date=${date}`),
};
