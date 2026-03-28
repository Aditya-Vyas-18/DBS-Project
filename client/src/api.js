const base = 'https://dbs-project-uclm.onrender.com/api';

function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Invalid response' };
  }
  if (!res.ok) {
    const fromJson =
      data && typeof data === 'object'
        ? data.error || data.message || data.detail
        : null;
    const hint =
      res.status === 502 || res.status === 504
        ? ' API unreachable — is the server running? (cd server && npm run dev)'
        : '';
    const msg =
      fromJson ||
      (text && text.length && text.length < 400 && !text.trim().startsWith('<')
        ? text.trim()
        : null) ||
      (res.status === 500 && !text
        ? 'Server returned 500 with no body. Check the terminal where npm run dev is running.'
        : '') ||
      res.statusText;
    const err = new Error((msg + hint).trim());
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
