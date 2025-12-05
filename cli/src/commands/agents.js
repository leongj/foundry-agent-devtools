import { apiRequest, usageError } from '../http.js';
import { output, convertTimestamps } from '../util/format.js';

const API_VERSION = '2025-11-15-preview';

export async function agentsList(ctx) {
  if (ctx.agentsV1) {
    return legacyAgentsList(ctx);
  }

  const query = buildListQuery(ctx);
  const data = await apiRequest(ctx, 'agents', { query });
  emitAgentsTable(ctx, data, 'agents');
}

export async function agentShow(ctx, agentId) {
  if (!agentId) throw usageError('Missing agentId');

  if (ctx.agentsV1) {
    return legacyAgentShow(ctx, agentId);
  }

  const agent = await apiRequest(ctx, `agents/${agentId}`, {
    query: { 'api-version': API_VERSION },
  });
  emitAgentDetail(ctx, agent);
}

function buildListQuery(ctx) {
  const query = { 'api-version': API_VERSION };
  if (ctx.limit) query.limit = ctx.limit;
  if (ctx.order) query.order = ctx.order;
  if (ctx.after) query.after = ctx.after;
  if (ctx.before) query.before = ctx.before;
  return query;
}

function emitAgentsTable(ctx, data, collectionKey) {
  const list = data?.[collectionKey] || data?.assistants || data?.data || data?.items || data;
  const rows = Array.isArray(list) ? list : (list ? [list] : []);
  const normalized = rows.map(agent => normalizeAgentRow(agent));
  const jsonReady = rows.map(agent => convertTimestamps(agent));
  const dataForOutput = ctx.raw ? rows : (ctx.json ? jsonReady : normalized);
  output(ctx, dataForOutput, [
    { header: 'Name', key: 'name' },
    { header: 'Model', key: 'model' },
    { header: 'Created', key: 'created_at' }
  ]);
}

function emitAgentDetail(ctx, agent) {
  if (ctx.raw) {
    process.stdout.write(typeof agent === 'string' ? agent : JSON.stringify(agent));
    return;
  }
  const processed = ctx.json ? convertTimestamps(agent) : convertTimestamps(agent);
  console.log(JSON.stringify(processed, null, 2));
}

async function legacyAgentsList(ctx) {
  const query = buildLegacyQuery(ctx);
  const data = await apiRequest(ctx, 'assistants', { query });
  emitAgentsTable(ctx, data, 'assistants');
}

async function legacyAgentShow(ctx, agentId) {
  const agent = await apiRequest(ctx, `assistants/${agentId}`);
  emitAgentDetail(ctx, agent);
}

function buildLegacyQuery(ctx) {
  const filters = {};
  if (ctx.limit) filters.limit = ctx.limit;
  if (ctx.order) filters.order = ctx.order;
  if (ctx.after) filters.after = ctx.after;
  if (ctx.before) filters.before = ctx.before;
  return filters;
}

function normalizeAgentRow(agent) {
  if (!agent) return {}; 
  const latest = agent?.versions?.latest || null;
  const convertedAgent = convertTimestamps(agent) || {};
  const convertedLatest = latest ? convertTimestamps(latest) : null;
  const model = latest?.definition?.model
    || latest?.definition?.deployment
    || convertedAgent.model
    || '';
  const createdEpoch = latest?.created_at
    || agent.created_at
    || null;
  const created = createdEpoch ? new Date(createdEpoch * 1000).toISOString() : '';
  return {
    id: convertedAgent.id || agent.id || '',
    name: convertedAgent.name || agent.name || '',
    model,
    created_at: created,
  };
}
