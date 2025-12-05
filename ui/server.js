import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRequest } from '../cli/src/http.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 4173);
const V2_AGENT_API_VERSION = '2025-11-15-preview';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    if (requestUrl.pathname === '/api/agents') {
      await handleAgentsRequest(requestUrl, res);
      return;
    }
    await serveStaticAsset(requestUrl.pathname, res);
  } catch (err) {
    console.error('[server] unexpected error', err);
    sendJson(res, 500, { error: 'Unexpected server error' });
  }
});

server.listen(PORT, () => {
  console.log(`aza ui listening on http://localhost:${PORT}`);
});

async function handleAgentsRequest(url, res) {
  try {
    const ctx = buildRequestContext(url);
    const endpoint = ctx.agentsV1 ? 'assistants' : 'agents';
    const query = ctx.agentsV1 ? buildLegacyQuery(ctx) : buildV2Query(ctx);
    const payload = await apiRequest(ctx, endpoint, { query });
    const agents = normalizeAgents(payload, ctx.agentsV1 ? 'assistants' : 'agents');
    sendJson(res, 200, {
      agents,
      total: agents.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to load agents' });
  }
}

function buildRequestContext(url) {
  const project = url.searchParams.get('project') || process.env.AZA_PROJECT;
  if (!project) {
    const e = new Error('Set AZA_PROJECT or supply ?project=<endpoint>');
    e.code = 'USAGE';
    throw e;
  }
  const limit = parseNumber(url.searchParams.get('limit'));
  const ctx = {
    project,
    apiVersion: url.searchParams.get('apiVersion') || undefined,
    limit: limit ?? undefined,
    order: url.searchParams.get('order') || undefined,
    after: url.searchParams.get('after') || undefined,
    before: url.searchParams.get('before') || undefined,
    agentsV1: url.searchParams.get('mode') === 'legacy',
    debug: url.searchParams.get('debug') === 'true' || process.env.AZA_DEBUG === '1',
  };
  return ctx;
}

function buildV2Query(ctx) {
  const query = { 'api-version': V2_AGENT_API_VERSION };
  if (ctx.limit) query.limit = ctx.limit;
  if (ctx.order) query.order = ctx.order;
  if (ctx.after) query.after = ctx.after;
  if (ctx.before) query.before = ctx.before;
  return query;
}

function buildLegacyQuery(ctx) {
  const query = {};
  if (ctx.limit) query.limit = ctx.limit;
  if (ctx.order) query.order = ctx.order;
  if (ctx.after) query.after = ctx.after;
  if (ctx.before) query.before = ctx.before;
  return query;
}

function normalizeAgents(payload, key) {
  const rawList = payload?.[key] || payload?.assistants || payload?.data || payload?.items || payload;
  const rows = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];
  return rows.map(agent => normalizeAgentRow(agent));
}

function normalizeAgentRow(agent) {
  if (!agent) return { id: '', name: '', model: '', created: '' };
  const latest = agent?.versions?.latest || null;
  const model = latest?.definition?.model
    || latest?.definition?.deployment
    || agent?.model
    || '';
  const createdEpoch = latest?.created_at || agent?.created_at || agent?.createdAt || null;
  return {
    id: agent?.id || '',
    name: agent?.name || '',
    model,
    created: createdEpoch ? epochToIso(createdEpoch) : '',
  };
}

function epochToIso(value) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!numeric || Number.isNaN(numeric)) return '';
  const seconds = numeric > 10_000_000_000 ? Math.floor(numeric / 1000) : numeric;
  return new Date(seconds * 1000).toISOString();
}

function parseNumber(value) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function serveStaticAsset(pathname, res) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const safePath = path.normalize(relativePath).replace(/^\.\/+/, '');
  const absolutePath = path.join(publicDir, safePath);
  if (!absolutePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }
  try {
    const data = await readFile(absolutePath);
    const ext = path.extname(absolutePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(data);
  } catch (err) {
    if (safePath !== 'index.html') {
      await serveStaticAsset('/', res);
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
  }
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
