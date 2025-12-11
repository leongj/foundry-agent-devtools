import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRequest } from '../cli/src/http.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'dist');
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
    if (requestUrl.pathname === '/api/conversations') {
      if (req.method === 'POST') {
        await handleCreateConversationRequest(requestUrl, req, res);
      } else {
        await handleConversationsRequest(requestUrl, res);
      }
      return;
    }
    if (requestUrl.pathname.startsWith('/api/conversations/') && requestUrl.pathname.endsWith('/items')) {
      await handleConversationItemsRequest(requestUrl, res);
      return;
    }
    // Handle DELETE /api/conversations/{id}
    if (requestUrl.pathname.startsWith('/api/conversations/') && req.method === 'DELETE') {
      await handleDeleteConversationRequest(requestUrl, res);
      return;
    }
    if (requestUrl.pathname === '/api/responses') {
      await handleResponsesRequest(requestUrl, res);
      return;
    }
    // Handle DELETE /api/responses/{id}
    if (requestUrl.pathname.startsWith('/api/responses/') && req.method === 'DELETE') {
      await handleDeleteResponseRequest(requestUrl, res);
      return;
    }
    if (requestUrl.pathname.startsWith('/api/responses/')) {
      await handleResponseDetailsRequest(requestUrl, res);
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
    const rawList = payload?.[ctx.agentsV1 ? 'assistants' : 'agents'] || payload?.data || payload?.items || payload;
    const agents = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];
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
  const ctx = {
    project,
    apiVersion: url.searchParams.get('apiVersion') || undefined,
    limit: url.searchParams.get('limit') || undefined,
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

async function handleConversationsRequest(url, res) {
  try {
    const ctx = buildRequestContext(url);
    const query = { 'api-version': V2_AGENT_API_VERSION };
    if (ctx.limit) query.limit = ctx.limit;
    if (ctx.order) query.order = ctx.order;
    if (ctx.after) query.after = ctx.after;
    if (ctx.before) query.before = ctx.before;
    
    const payload = await apiRequest(ctx, 'openai/conversations', { query });
    const rawList = payload?.conversations || payload?.data || payload?.items || payload;
    const conversations = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];
    sendJson(res, 200, {
      conversations,
      total: conversations.length,
      has_more: payload?.has_more ?? false,
      first_id: payload?.first_id || (conversations.length > 0 ? conversations[0].id : null),
      last_id: payload?.last_id || (conversations.length > 0 ? conversations[conversations.length - 1].id : null),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to load conversations' });
  }
}

async function handleCreateConversationRequest(url, req, res) {
  try {
    const ctx = buildRequestContext(url);
    const query = { 'api-version': V2_AGENT_API_VERSION };
    
    // Read request body
    let body = {};
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch {
      // Empty body is acceptable for creating a conversation
    }
    
    const payload = await apiRequest(ctx, 'openai/conversations', { 
      query, 
      method: 'POST',
      body 
    });
    sendJson(res, 201, payload);
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to create conversation' });
  }
}

async function handleDeleteConversationRequest(url, res) {
  try {
    const ctx = buildRequestContext(url);
    // Extract conversation ID from path like /api/conversations/{id}
    const match = url.pathname.match(/\/api\/conversations\/([^/]+)$/);
    if (!match || !match[1]) {
      sendJson(res, 400, { error: 'Invalid conversation ID' });
      return;
    }
    const conversationId = match[1];
    
    const query = { 'api-version': V2_AGENT_API_VERSION };
    
    await apiRequest(ctx, `openai/conversations/${conversationId}`, { 
      query, 
      method: 'DELETE' 
    });
    sendJson(res, 200, { deleted: true, id: conversationId });
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to delete conversation' });
  }
}

async function handleConversationItemsRequest(url, res) {
  try {
    const ctx = buildRequestContext(url);
    // Extract conversation ID from path like /api/conversations/{id}/items
    const match = url.pathname.match(/\/api\/conversations\/([^/]+)\/items/);
    if (!match || !match[1]) {
      sendJson(res, 400, { error: 'Invalid conversation ID' });
      return;
    }
    const conversationId = match[1];
    
    const query = { 'api-version': V2_AGENT_API_VERSION };
    if (ctx.limit) query.limit = ctx.limit;
    if (ctx.order) query.order = ctx.order;
    if (ctx.after) query.after = ctx.after;
    if (ctx.before) query.before = ctx.before;
    
    const payload = await apiRequest(ctx, `openai/conversations/${conversationId}/items`, { query });
    sendJson(res, 200, payload);
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to load conversation items' });
  }
}

async function handleResponsesRequest(url, res) {
  try {
    const ctx = buildRequestContext(url);
    const query = { 'api-version': V2_AGENT_API_VERSION };
    if (ctx.limit) query.limit = ctx.limit;
    if (ctx.order) query.order = ctx.order;
    if (ctx.after) query.after = ctx.after;
    if (ctx.before) query.before = ctx.before;
    
    const payload = await apiRequest(ctx, 'openai/responses', { query });
    const rawList = payload?.responses || payload?.data || payload?.items || payload;
    const responses = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];
    sendJson(res, 200, {
      responses,
      total: responses.length,
      has_more: payload?.has_more ?? false,
      first_id: payload?.first_id || (responses.length > 0 ? responses[0].id : null),
      last_id: payload?.last_id || (responses.length > 0 ? responses[responses.length - 1].id : null),
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to load responses' });
  }
}

async function handleResponseDetailsRequest(url, res) {
  try {
    const ctx = buildRequestContext(url);
    // Extract response ID from path like /api/responses/{id}
    const match = url.pathname.match(/\/api\/responses\/([^/]+)$/);
    if (!match || !match[1]) {
      sendJson(res, 400, { error: 'Invalid response ID' });
      return;
    }
    const responseId = match[1];
    
    const query = { 'api-version': V2_AGENT_API_VERSION };
    
    const payload = await apiRequest(ctx, `openai/responses/${responseId}`, { query });
    sendJson(res, 200, payload);
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to load response details' });
  }
}

async function handleDeleteResponseRequest(url, res) {
  try {
    const ctx = buildRequestContext(url);
    // Extract response ID from path like /api/responses/{id}
    const match = url.pathname.match(/\/api\/responses\/([^/]+)$/);
    if (!match || !match[1]) {
      sendJson(res, 400, { error: 'Invalid response ID' });
      return;
    }
    const responseId = match[1];
    
    const query = { 'api-version': V2_AGENT_API_VERSION };
    
    await apiRequest(ctx, `openai/responses/${responseId}`, { 
      query, 
      method: 'DELETE' 
    });
    sendJson(res, 200, { deleted: true, id: responseId });
  } catch (err) {
    if (err.code === 'USAGE') {
      sendJson(res, 400, { error: err.message });
      return;
    }
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    sendJson(res, status, { error: err.message || 'Failed to delete response' });
  }
}
