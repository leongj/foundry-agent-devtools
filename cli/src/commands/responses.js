import { apiRequest, usageError } from '../http.js';
import { output, convertTimestamps } from '../util/format.js';

const API_VERSION = '2025-11-15-preview';

export async function responsesList(ctx) {
  const query = buildListQuery(ctx);
  const data = await apiRequest(ctx, 'openai/responses', { query });
  const list = data?.responses || data?.data || data?.items || data;
  const processed = ctx.raw ? list : convertTimestamps(list);
  const tableData = (ctx.json || ctx.raw) ? processed : addContentPreview(processed);
  output(ctx, tableData, [
    { header: 'ID', key: 'id' },
    { header: 'Status', key: 'status' },
    { header: 'Created', key: 'created_at_pretty' },
    { header: 'Content Preview', key: 'content_preview' }
  ]);
}

export async function responsesShow(ctx, responseId) {
  if (!responseId) throw usageError('Missing responseId');
  const data = await apiRequest(ctx, `openai/responses/${responseId}`, {
    query: { 'api-version': API_VERSION }
  });
  const processed = ctx.raw ? data : convertTimestamps(data);
  output(ctx, processed);
}

function buildListQuery(ctx) {
  const query = { 'api-version': API_VERSION };
  if (ctx.limit) query.limit = ctx.limit;
  if (ctx.order) query.order = ctx.order;
  if (ctx.after) query.after = ctx.after;
  if (ctx.before) query.before = ctx.before;
  return query;
}

function addContentPreview(value) {
  if (!Array.isArray(value)) return value;
  return value.map(item => {
    const preview = getFirstContentText(item);
    return preview ? { ...item, content_preview: preview.slice(0, 20) } : item;
  });
}

function getFirstContentText(item) {
  if (!item || !Array.isArray(item.output)) return '';
  for (const entry of item.output) {
    if (!entry || !Array.isArray(entry.content)) continue;
    for (const block of entry.content) {
      if (typeof block?.text === 'string' && block.text.length) {
        return block.text;
      }
    }
  }
  return '';
}
