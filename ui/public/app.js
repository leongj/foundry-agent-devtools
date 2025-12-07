const form = document.getElementById('agentForm');
const projectInput = document.getElementById('project');
const limitInput = document.getElementById('limit');
const orderSelect = document.getElementById('order');
const modeInputs = [...document.querySelectorAll('input[name="mode"]')];
const statusBar = document.getElementById('status');
const agentsGrid = document.getElementById('agents');
const refreshBtn = document.getElementById('refreshBtn');
const tabButtons = document.querySelectorAll('.tab');
const workspaces = document.querySelectorAll('.workspace');
const conversationTimeline = document.getElementById('conversationTimeline');
const conversationMeta = document.getElementById('conversationMeta');
const responseSummary = document.getElementById('responseSummary');
const responseOutput = document.getElementById('responseOutput');
const refreshConversationBtn = document.getElementById('refreshConversation');
const refreshResponseBtn = document.getElementById('refreshResponse');
const agentsTableBody = document.querySelector('#agentsTable tbody');
const conversationTableBody = document.querySelector('#conversationTable tbody');
const responsesTableBody = document.querySelector('#responsesTable tbody');
const STORAGE_KEY = 'aza-ui-settings';
const DEFAULT_PROJECT_ENDPOINT = 'https://aifoundry-au.services.ai.azure.com/api/projects/aiproject1';
const MAX_TABLE_ROWS = 20;

let conversationsLoaded = false;
let responseLoaded = false;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

init();

function init() {
  const saved = loadSettings();
  projectInput.value = saved.project || projectInput.value || DEFAULT_PROJECT_ENDPOINT;
  if (saved.limit) limitInput.value = saved.limit;
  if (saved.order) orderSelect.value = saved.order;
  if (saved.mode) {
    const radio = modeInputs.find(input => input.value === saved.mode);
    if (radio) radio.checked = true;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    fetchAgents();
  });

  refreshBtn.addEventListener('click', () => fetchAgents());

  tabButtons.forEach(button => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });

  refreshConversationBtn?.addEventListener('click', () => fetchConversations(true));
  refreshResponseBtn?.addEventListener('click', () => fetchResponse(true));

  activateTab('agents');

  if (projectInput.value) {
    fetchAgents();
  }
}

async function fetchAgents() {
  const project = projectInput.value.trim();
  const limit = limitInput.value.trim();
  const order = orderSelect.value;
  const mode = (modeInputs.find(input => input.checked) || {}).value || 'modern';

  if (!project) {
    setStatus('Provide a project endpoint to continue.', 'error');
    return;
  }

  saveSettings({ project, limit, order, mode });

  const params = new URLSearchParams({ project });
  if (limit) params.set('limit', limit);
  if (order) params.set('order', order);
  if (mode === 'legacy') params.set('mode', 'legacy');

  setStatus('Loading agents…', 'loading');
  agentsGrid.innerHTML = '';

  try {
    const response = await fetch(`/api/agents?${params.toString()}`);
    if (!response.ok) {
      const text = await response.text();
      try {
        const payload = JSON.parse(text);
        throw new Error(payload.error || 'Failed to load agents');
      } catch {
        throw new Error(text || 'Failed to load agents');
      }
    }
    const data = await response.json();
    renderAgents(data.agents || []);
    setStatus(`Loaded ${data.total ?? data.agents?.length ?? 0} agents at ${formatNow(data.fetchedAt)}`, 'success');
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Unable to load agents', 'error');
    renderAgents([]);
  }
}

async function fetchConversations(force = false) {
  if (conversationsLoaded && !force) return;
  conversationsLoaded = true;
  showConversationMessage('Loading sample conversation…');

  try {
    const response = await fetch('/api/examples/conversations');
    if (!response.ok) throw new Error('Failed to load sample conversation');
    const payload = await response.json();
    const items = Array.isArray(payload.data) ? payload.data : [];
    renderConversationMeta(items, payload.conversation);
    renderConversationTimeline(items);
  } catch (err) {
    console.error(err);
    conversationsLoaded = false;
    showConversationMessage(err.message || 'Unable to load sample conversation');
    renderConversationTable([]);
  }
}

async function fetchResponse(force = false) {
  if (responseLoaded && !force) return;
  responseLoaded = true;
  showResponseMessage('Loading sample response…');

  try {
    const response = await fetch('/api/examples/response');
    if (!response.ok) throw new Error('Failed to load sample response');
    const payload = await response.json();
    renderResponseSummary(payload);
    renderResponseOutput(payload);
  } catch (err) {
    console.error(err);
    responseLoaded = false;
    showResponseMessage(err.message || 'Unable to load sample response');
    renderResponseTable();
  }
}

function renderAgents(items) {
  if (!items.length) {
    agentsGrid.innerHTML = '<div class="empty-state">No agents returned for the current filters.</div>';
    renderAgentsTable(items);
    return;
  }
  const markup = items.map(agent => {
    const created = agent.created ? dateFormatter.format(new Date(agent.created)) : 'Unknown';
    return `
      <article class="agent-card">
        <p class="eyebrow">${escapeHtml(agent.id || 'Unknown id')}</p>
        <h3>${escapeHtml(agent.name || 'Unnamed agent')}</h3>
        <div class="agent-meta">
          <div>
            <p class="meta-label">Model</p>
            <p>${escapeHtml(agent.model || '—')}</p>
          </div>
          <div>
            <p class="meta-label">Created</p>
            <p>${escapeHtml(created)}</p>
          </div>
        </div>
      </article>
    `;
  }).join('');
  agentsGrid.innerHTML = markup;
  renderAgentsTable(items);
}

function renderConversationMeta(items, conversationInfo) {
  if (!items.length) {
    conversationMeta.innerHTML = '<div class="empty-state">No events in the sample payload.</div>';
    renderConversationTable([]);
    return;
  }

  const summary = items.reduce((acc, item) => {
    if (item.type === 'message') {
      if (item.role === 'user') acc.users += 1;
      else if (item.role === 'assistant') acc.assistants += 1;
      else acc.systems += 1;
    } else {
      acc.tools += 1;
    }
    return acc;
  }, { users: 0, assistants: 0, systems: 0, tools: 0 });

  const rows = [
    { label: 'Events', value: items.length },
    { label: 'User turns', value: summary.users },
    { label: 'Assistant turns', value: summary.assistants },
    { label: 'Tool events', value: summary.tools }
  ];

  const conversationId = conversationInfo?.id;
  if (conversationId) {
    rows.unshift({ label: 'Conversation ID', value: conversationId });
  }

  conversationMeta.innerHTML = rows.map(row => `
    <div class="meta-card">
      <p class="meta-label">${escapeHtml(row.label)}</p>
      <p class="metric">${escapeHtml(String(row.value ?? '—'))}</p>
    </div>
  `).join('');
  renderConversationTable(items);
}

function renderConversationTimeline(items) {
  if (!items.length) {
    showConversationMessage('No timeline entries available.');
    return;
  }

  const markup = items.map(item => {
    const badge = item.role ? `${item.role} · ${item.type}` : item.type || 'event';
    const idLabel = item.id ? `<p class="meta-label">${escapeHtml(item.id)}</p>` : '';
    const content = formatEventContent(item);
    return `
      <article class="timeline-item">
        <div class="badge">${escapeHtml(badge)}</div>
        <div>${idLabel}${content}</div>
      </article>
    `;
  }).join('');

  conversationTimeline.innerHTML = markup;
}

function renderResponseSummary(payload) {
  const toolChoice = typeof payload.tool_choice === 'string'
    ? payload.tool_choice
    : payload.tool_choice?.type;
  const createdDisplay = payload.created_at !== undefined && payload.created_at !== null
    ? formatNow(typeof payload.created_at === 'number'
        ? new Date(payload.created_at * 1000)
        : payload.created_at)
    : null;
  const entries = [
    ['Response ID', payload.id],
    ['Status', payload.status],
    ['Agent', payload.agent?.name || payload.agent?.type],
    ['Conversation', payload.conversation?.id],
    ['Temperature', payload.temperature],
    ['Tool choice', toolChoice],
    ['Created', createdDisplay],
    ['Total tokens', payload.usage?.total_tokens],
    ['Output tokens', payload.usage?.output_tokens],
    ['Input tokens', payload.usage?.input_tokens]
  ];

  const markup = entries
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(String(value))}</dd>
    `)
    .join('');

  responseSummary.innerHTML = markup || '<dt>Note</dt><dd>No metadata available in sample payload.</dd>';
  renderResponseTable(payload);
}

function renderResponseOutput(payload) {
  const outputs = [];
  (payload.output || []).forEach(entry => {
    if (entry.content && Array.isArray(entry.content)) {
      entry.content.forEach(chunk => {
        if (chunk.type === 'output_text' && chunk.text) {
          outputs.push(chunk.text);
        }
      });
    }
  });

  if (outputs.length) {
    responseOutput.textContent = outputs.join('\n\n');
  } else {
    responseOutput.textContent = 'No assistant output found in sample payload.';
  }
}

function renderAgentsTable(items) {
  if (!agentsTableBody) return;
  if (!items.length) {
    renderEmptyTable(agentsTableBody, 4, 'No agents loaded yet.');
    return;
  }
  const rows = items.slice(0, MAX_TABLE_ROWS).map(agent => {
    const created = agent.created ? dateFormatter.format(new Date(agent.created)) : 'Unknown';
    return `
      <tr>
        <td>${escapeHtml(agent.name || 'Unnamed agent')}</td>
        <td>${escapeHtml(agent.id || '—')}</td>
        <td>${escapeHtml(agent.model || '—')}</td>
        <td>${escapeHtml(created)}</td>
      </tr>
    `;
  }).join('');
  agentsTableBody.innerHTML = rows;
}

function renderConversationTable(items) {
  if (!conversationTableBody) return;
  if (!items.length) {
    renderEmptyTable(conversationTableBody, 5, 'No conversation events yet.');
    return;
  }
  const rows = items.slice(0, MAX_TABLE_ROWS).map((item, index) => `
    <tr>
      <td>${escapeHtml(String(index + 1))}</td>
      <td>${escapeHtml(item.type || 'event')}</td>
      <td>${escapeHtml(item.role || '—')}</td>
      <td>${escapeHtml(item.id || '—')}</td>
      <td>${escapeHtml(truncateText(getConversationPreview(item)) || '—')}</td>
    </tr>
  `).join('');
  conversationTableBody.innerHTML = rows;
}

function renderResponseTable(payload = {}) {
  if (!responsesTableBody) return;
  const entries = Array.isArray(payload.output) ? payload.output : [];
  if (!entries.length) {
    renderEmptyTable(responsesTableBody, 5, 'No response output yet.');
    return;
  }
  const rows = entries.slice(0, MAX_TABLE_ROWS).map((entry, index) => `
    <tr>
      <td>${escapeHtml(String(index + 1))}</td>
      <td>${escapeHtml(entry.type || 'message')}</td>
      <td>${escapeHtml(entry.role || 'assistant')}</td>
      <td>${escapeHtml(entry.id || '—')}</td>
      <td>${escapeHtml(truncateText(getResponsePreview(entry)) || '—')}</td>
    </tr>
  `).join('');
  responsesTableBody.innerHTML = rows;
}

function renderEmptyTable(target, colspan, message) {
  if (!target) return;
  target.innerHTML = `
    <tr>
      <td colspan="${Number(colspan) || 1}">${escapeHtml(message)}</td>
    </tr>
  `;
}

function getConversationPreview(item) {
  if (!item) return '';
  if (item.type === 'message') {
    return extractTextFromContent(item.content);
  }
  if (item.type?.includes('file_search')) {
    return Array.isArray(item.queries) && item.queries.length ? item.queries[0] : '';
  }
  if (item.type === 'code_interpreter_call') {
    return item.code || (typeof item.inputs === 'string' ? item.inputs : 'Code interpreter call');
  }
  return item.status || '';
}

function getResponsePreview(entry) {
  if (!entry) return '';
  if (Array.isArray(entry.content)) {
    return extractTextFromContent(entry.content);
  }
  return '';
}

function truncateText(value, max = 120) {
  if (!value) return '';
  const text = String(value).trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function setStatus(message, tone) {
  statusBar.textContent = message;
  statusBar.className = 'status-bar' + (tone ? ` ${tone}` : '');
}

function activateTab(name) {
  tabButtons.forEach(button => {
    const isActive = button.dataset.tab === name;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  workspaces.forEach(section => {
    section.hidden = section.dataset.panel !== name;
  });

  if (name === 'conversations') {
    fetchConversations();
  } else if (name === 'responses') {
    fetchResponse();
  }
}

function saveSettings(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function formatNow(value) {
  if (!value) return dateFormatter.format(new Date());
  const isDate = value instanceof Date;
  const time = isDate ? value : new Date(value);
  return Number.isNaN(time.getTime()) ? dateFormatter.format(new Date()) : dateFormatter.format(time);
}

function showConversationMessage(message) {
  conversationMeta.innerHTML = '';
  conversationTimeline.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function showResponseMessage(message) {
  responseSummary.innerHTML = '';
  responseOutput.textContent = message;
}

function formatEventContent(item) {
  if (item.type === 'message') {
    const body = extractTextFromContent(item.content);
    return body ? wrapPre(body) : '<p>No textual content in this message.</p>';
  }

  if (item.type?.includes('file_search')) {
    const queries = Array.isArray(item.queries) ? item.queries.slice(0, 3).join('\n') : '';
    return queries ? wrapPre(`Queries:\n${queries}`) : wrapPre(JSON.stringify(item, null, 2));
  }

  if (item.type === 'code_interpreter_call') {
    const code = item.code || item.inputs || '';
    return code ? wrapPre(String(code)) : wrapPre(JSON.stringify(item, null, 2));
  }

  return wrapPre(JSON.stringify(item, null, 2));
}

function extractTextFromContent(content) {
  if (!Array.isArray(content)) return '';
  return content
    .map(chunk => chunk?.text)
    .filter(Boolean)
    .join('\n\n');
}

function wrapPre(value) {
  return `<pre>${escapeHtml(value)}</pre>`;
}

function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
