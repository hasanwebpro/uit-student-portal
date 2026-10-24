/** Thin fetch wrapper. Same-origin cookies carry the session; a custom header satisfies the server's CSRF check. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details ?? null;
  }
}

const buildUrl = (path, params) => {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  return url;
};

/**
 * The access token lives 15 minutes. When a call comes back 401 we try ONE silent refresh (the refresh token is an httpOnly
 * cookie the browser sends by itself) and replay the call. Concurrent 401s share a single refresh request.
 */
let refreshing = null;
const silentRefresh = () => (refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'uit-portal' } })
  .then((r) => r.ok).catch(() => false).finally(() => { refreshing = null; }));
const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/me'];

async function request(method, path, options = {}, retried = false) {
  const { params, body, signal, raw } = options;
  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method, signal, credentials: 'same-origin',
      headers: { Accept: 'application/json', 'X-Requested-With': 'uit-portal', ...(raw ? { 'Content-Type': raw.type } : body !== undefined && { 'Content-Type': 'application/json' }) },
      body: raw ? raw.body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, navigator.onLine ? 'Could not reach the server. Please try again.' : 'You are offline. Check your connection and try again.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !retried && !NO_REFRESH.includes(path) && await silentRefresh()) return request(method, path, options, true);
  if (!res.ok) {
    if (res.status === 401 && !NO_REFRESH.includes(path)) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(res.status, data.error || 'Something went wrong.', data.details);
  }
  return data;
}

export const api = {
  get: (path, params, signal) => request('GET', path, { params, signal }),
  post: (path, body = {}) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
  /** Upload a Blob as-is (used for the profile picture). */
  putBlob: (path, blob) => request('PUT', path, { raw: { body: blob, type: blob.type } }),
};
