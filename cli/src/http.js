import { getToken } from './auth.js';

export async function apiRequest(ctx, path, { query = {}, method = 'GET', body } = {}) {
  const base = ctx.project;
  if (!base) throw usageError('Missing project endpoint: provide --project or AZA_PROJECT');
  const apiVersion = ctx.apiVersion || 'v1';
  const url = new URL(path.startsWith('http') ? path : joinUrl(base, path));

  // merge existing search params if any already in base
  if (!url.searchParams.has('api-version')) {
    url.searchParams.set('api-version', apiVersion);
  }
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const token = await getToken();
  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
  let payload;
  if (body !== undefined) {
    payload = typeof body === 'string' ? body : JSON.stringify(body ?? {});
    headers['Content-Type'] = 'application/json';
  }

  if (ctx.debug) {
    console.error('[HTTP] ->', method, url.toString());
  }

  const res = await fetch(url, { method, headers, body: payload });
  const text = await res.text();
  if (ctx.debug) {
    console.error('[HTTP] <-', res.status, text.slice(0, 400));
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return data;
}

function joinUrl(base, path) {
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
  return base + path;
}

export function usageError(msg) {
  const e = new Error(msg);
  e.code = 'USAGE';
  return e;
}
