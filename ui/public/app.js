const form = document.getElementById('agentForm');
const projectInput = document.getElementById('project');
const limitInput = document.getElementById('limit');
const orderSelect = document.getElementById('order');
const modeInputs = [...document.querySelectorAll('input[name="mode"]')];
const statusBar = document.getElementById('status');
const agentsGrid = document.getElementById('agents');
const refreshBtn = document.getElementById('refreshBtn');
const STORAGE_KEY = 'aza-ui-settings';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

init();

function init() {
  const saved = loadSettings();
  if (saved.project) projectInput.value = saved.project;
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

function renderAgents(items) {
  if (!items.length) {
    agentsGrid.innerHTML = '<div class="empty-state">No agents returned for the current filters.</div>';
    return;
  }
  const markup = items.map(agent => {
    const created = agent.created ? dateFormatter.format(new Date(agent.created)) : 'Unknown';
    return `
      <article class="agent-card">
        <p class="eyebrow">${agent.id || 'Unknown id'}</p>
        <h3>${agent.name || 'Unnamed agent'}</h3>
        <div class="agent-meta">
          <div>
            <p class="meta-label">Model</p>
            <p>${agent.model || '—'}</p>
          </div>
          <div>
            <p class="meta-label">Created</p>
            <p>${created}</p>
          </div>
        </div>
      </article>
    `;
  }).join('');
  agentsGrid.innerHTML = markup;
}

function setStatus(message, tone) {
  statusBar.textContent = message;
  statusBar.className = 'status-bar' + (tone ? ` ${tone}` : '');
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

function formatNow(fetchedAt) {
  if (!fetchedAt) return dateFormatter.format(new Date());
  const time = new Date(fetchedAt);
  return Number.isNaN(time.getTime()) ? dateFormatter.format(new Date()) : dateFormatter.format(time);
}
