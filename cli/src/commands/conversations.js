import { apiRequest, usageError } from '../http.js';
import { output, convertTimestamps } from '../util/format.js';

const API_VERSION = '2025-11-15-preview';

export async function conversationsList(ctx) {
  const query = buildListQuery(ctx);
  const data = await apiRequest(ctx, 'openai/conversations', { query });
  const list = data?.conversations || data?.data || data?.items || data;
  const processed = ctx.raw ? list : convertTimestamps(list);
  output(ctx, processed, [
    { header: 'ID', key: 'id' },
    { header: 'Created', key: 'created_at_pretty' }
  ]);
}

export async function conversationsShow(ctx, conversationId) {
  if (!conversationId) throw usageError('Missing conversationId');
  const conversationData = await apiRequest(ctx, `openai/conversations/${conversationId}`, {
    query: { 'api-version': API_VERSION }
  });

  let itemsData = null;
  try {
    const itemsQuery = buildItemsQuery(ctx);
    itemsData = await apiRequest(ctx, `openai/conversations/${conversationId}/items`, { query: itemsQuery });
  } catch (e) {
    if (ctx.debug) console.error('[WARN] Failed to fetch conversation items:', e.message);
  }

  if (ctx.json || ctx.raw) {
    const stringify = (obj) => ctx.raw ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
    if (itemsData) {
      process.stdout.write(stringify(conversationData) + '\n\n---\n\n' + stringify(itemsData) + '\n');
    } else {
      process.stdout.write(stringify(conversationData) + '\n');
    }
    return;
  }

  const convo = convertTimestamps(conversationData);
  const listObj = itemsData ? convertTimestamps(itemsData) : null;
  const items = normalizeItems(listObj);
  items.sort((a, b) => getTs(a) - getTs(b));

  const count = items.length;
  console.log(`Conversation ${convo.id || conversationId} — ${count} item${count === 1 ? '' : 's'}`);

  for (const item of items) {
    const ts = item.created_at_pretty || item.created_at || '';
    const role = item.role || item.type || 'unknown';
    const extras = [];
    if (item.id) extras.push(`id: ${item.id}`);
    if (item.run_id) extras.push(`run: ${shorten(item.run_id)}`);
    const callId = item.call_id || item.callId;
    if (callId) extras.push(`call: ${shorten(callId)}`);
    let header = `${ts} ${role}`.trim();
    if (extras.length) header += ` (${extras.join(', ')})`;
    console.log(header + ':');

    const body = formatItemBody(ctx, item);
    for (const line of body.split('\n')) {
      console.log('  ' + line);
    }

    const citationCount = countCitations(item);
    const attachmentCount = Array.isArray(item.attachments) ? item.attachments.length : 0;
    const indicators = [];
    if (citationCount) indicators.push(`${citationCount} citation${citationCount === 1 ? '' : 's'}`);
    if (attachmentCount) indicators.push(`${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}`);
    if (indicators.length) console.log('  [' + indicators.join(', ') + ']');

    if (ctx.showCitations && citationCount) {
      const details = listCitations(item);
      for (const d of details) console.log('    - ' + d);
    }
    console.log('');
  }
}

function buildListQuery(ctx) {
  const query = { 'api-version': API_VERSION };
  if (ctx.limit) query.limit = ctx.limit;
  if (ctx.order) query.order = ctx.order;
  if (ctx.after) query.after = ctx.after;
  if (ctx.before) query.before = ctx.before;
  return query;
}

function buildItemsQuery(ctx) {
  const query = buildListQuery(ctx);
  if (!query.limit) query.limit = 100;
  if (!query.order) query.order = 'asc';
  if (ctx.runId) query.run_id = ctx.runId;
  return query;
}

function normalizeItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return [...payload];
  if (Array.isArray(payload.items)) return [...payload.items];
  if (Array.isArray(payload.data)) return [...payload.data];
  return [];
}

function getTs(item) {
  if (typeof item?.created_at_epoch === 'number') return item.created_at_epoch;
  if (item?.created_at) {
    const parsed = Date.parse(item.created_at);
    if (!Number.isNaN(parsed)) return parsed / 1000;
  }
  return 0;
}

function formatItemBody(ctx, item) {
  const parts = extractText(item);

  if (item?.type === 'remote_function_call') {
    const fnLabel = [item.label, item.name].filter(Boolean).join(' / ');
    if (fnLabel) parts.push(`Function: ${fnLabel}`);
    const argsText = formatStructured(item.arguments);
    if (argsText) parts.push(`Arguments:\n${argsText}`);
  }

  if (item?.type === 'remote_function_call_output') {
    const outputText = formatStructured(item.output);
    if (outputText) parts.push(`Output:\n${outputText}`);
  }

  if (item?.error) {
    const errorText = formatStructured(item.error);
    if (errorText) parts.push(`Error:\n${errorText}`);
  }

  if (!parts.length) parts.push('');
  let body = parts.join('\n\n');
  if (ctx.maxBody != null && body.length > ctx.maxBody) {
    body = body.slice(0, ctx.maxBody) + ' ... [truncated]';
  }
  if (!ctx.noWrap) body = softWrap(body, 100);
  return body;
}

function extractText(item) {
  const out = [];
  const content = Array.isArray(item?.content) ? item.content : (item?.content ? [item.content] : []);
  for (const chunk of content) {
    const text = coerceContentText(chunk);
    if (text) out.push(text);
  }
  if (out.length) return out;
  if (item?.display_text) return [String(item.display_text)];
  if (item?.summary) return [String(item.summary)];
  return [];
}

function coerceContentText(chunk) {
  if (chunk == null) return '';
  if (typeof chunk === 'string') return chunk;
  if (typeof chunk.text === 'string') return chunk.text;
  if (typeof chunk.text === 'object' && typeof chunk.text?.value === 'string') return chunk.text.value;
  if (typeof chunk.value === 'string') return chunk.value;
  if (typeof chunk.content === 'string') return chunk.content;
  return '';
}

function formatStructured(value) {
  if (value == null) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function countCitations(item) {
  let total = 0;
  for (const chunk of item?.content || []) {
    const annotations = getAnnotations(chunk);
    total += annotations.length || 0;
  }
  return total;
}

function listCitations(item) {
  const details = [];
  for (const chunk of item?.content || []) {
    const annotations = getAnnotations(chunk);
    for (const ann of annotations) {
      const id = ann?.file_citation?.file_id || ann?.file_path?.file_id || ann?.url_citation?.url || 'ref';
      const range = ann?.start_index != null && ann?.end_index != null ? `[${ann.start_index}-${ann.end_index}]` : '';
      details.push(`${ann.type || 'annotation'} ${range} -> ${id}`.trim());
    }
  }
  return details;
}

function getAnnotations(chunk) {
  return chunk?.text?.annotations || chunk?.annotations || [];
}

function softWrap(text, width = 100) {
  const lines = [];
  for (const para of String(text).split(/\n\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      if (!line) {
        line = word;
        continue;
      }
      if ((line + ' ' + word).length > width) {
        lines.push(line);
        line = word;
      } else {
        line += ' ' + word;
      }
    }
    if (line) lines.push(line);
    lines.push('');
  }
  if (lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

function shorten(id, n = 10) {
  const str = String(id);
  return str.length > n ? str.slice(0, n) + '...' : str;
}
