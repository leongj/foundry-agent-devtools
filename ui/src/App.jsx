import { useState, useEffect } from 'react'
import { useAgents, useConversations, useResponse } from './hooks'
import { AgentsList, AgentsTable, AgentDetail } from './components/Agents'
import { ConversationsList, ConversationsTable } from './components/Conversations'
import { ResponseView, ResponsesTable } from './components/Responses'
import { formatDate } from './utils'

const STORAGE_KEY = 'aza-ui-settings'
const DEFAULT_PROJECT = 'https://aifoundry-au.services.ai.azure.com/api/projects/aiproject1'

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function ConfigPanel({ config, onConfigChange, onRefresh, status }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onRefresh()
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project endpoint
          </label>
          <input
            type="url"
            value={config.project}
            onChange={(e) => onConfigChange({ ...config, project: e.target.value })}
            placeholder="https://example.eastus.projects.azure.com/projects/123/v1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={config.limit}
              onChange={(e) => onConfigChange({ ...config, limit: e.target.value })}
              placeholder="25"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={config.order}
              onChange={(e) => onConfigChange({ ...config, order: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              <option value="">Newest first</option>
              <option value="asc">Oldest first</option>
              <option value="desc">Newest first</option>
            </select>
          </div>
        </div>

        <div className="border border-dashed border-gray-300 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Mode</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="modern"
                checked={config.mode === 'modern'}
                onChange={(e) => onConfigChange({ ...config, mode: e.target.value })}
                className="text-orange-500 focus:ring-orange-400"
              />
              <span className="text-sm">v2 preview</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="legacy"
                checked={config.mode === 'legacy'}
                onChange={(e) => onConfigChange({ ...config, mode: e.target.value })}
                className="text-orange-500 focus:ring-orange-400"
              />
              <span className="text-sm">v1 classic</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-orange-400 to-yellow-400 text-white font-semibold py-2.5 px-4 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Load agents
        </button>
      </form>

      {status && (
        <div className={`mt-4 px-3 py-2 rounded-lg text-sm ${
          status.type === 'error'
            ? 'bg-red-50 text-red-700'
            : status.type === 'loading'
            ? 'bg-blue-50 text-blue-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  )
}

function Tabs({ activeTab, onChange }) {
  const tabs = ['agents', 'conversations', 'responses']

  return (
    <div className="inline-flex bg-white/60 backdrop-blur-sm border border-gray-200 rounded-full p-1 gap-1">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
            activeTab === tab
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

function App() {
  const saved = loadSettings()
  const [config, setConfig] = useState({
    project: saved.project || DEFAULT_PROJECT,
    limit: saved.limit || '',
    order: saved.order || '',
    mode: saved.mode || 'modern'
  })
  const [activeTab, setActiveTab] = useState('agents')
  const [selectedAgent, setSelectedAgent] = useState(null)

  const agentsData = useAgents(config)
  const conversationsData = useConversations(config)
  const responseData = useResponse()

  useEffect(() => {
    saveSettings(config)
  }, [config])

  const getStatus = () => {
    if (agentsData.loading) {
      return { type: 'loading', message: 'Loading agents…' }
    }
    if (agentsData.error) {
      return { type: 'error', message: agentsData.error }
    }
    if (agentsData.fetchedAt) {
      return {
        type: 'success',
        message: `Loaded ${agentsData.agents.length} agents at ${formatDate(agentsData.fetchedAt)}`
      }
    }
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <h1 className="text-xl md:text-5xl font-serif font-semibold text-gray-900 mb-2">
              Foundry Agent Service Explorer
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Point the UI at the same project endpoint you use for <code className="bg-gray-200 px-2 py-0.5 rounded">aza</code>. 
              Inspect agents, walk thread timelines, and peek at raw responses without leaving the browser.
            </p>
          </div>
          <ConfigPanel
            config={config}
            onConfigChange={setConfig}
            onRefresh={agentsData.refresh}
            status={getStatus()}
          />
        </header>

        {/* Tabs */}
        <Tabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Latest fetch</p>
                  <h2 className="text-xl font-semibold text-gray-900">Agent List</h2>
                </div>
                <button
                  onClick={agentsData.refresh}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
              <AgentsTable 
                agents={agentsData.agents} 
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
              />
            </section>

            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Agent Detail</p>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedAgent ? selectedAgent.name : 'Select an agent'}
                </h2>
              </div>
              <AgentDetail agent={selectedAgent} />
            </section>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="space-y-6">
            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Latest fetch</p>
                  <h2 className="text-xl font-semibold text-gray-900">Conversations (top 20)</h2>
                </div>
                <button
                  onClick={conversationsData.refresh}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
              <ConversationsTable conversations={conversationsData.conversations} />
            </section>

            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Live inventory</p>
                <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
              </div>
              <ConversationsList
                conversations={conversationsData.conversations}
                loading={conversationsData.loading}
                error={conversationsData.error}
              />
            </section>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div className="space-y-6">
            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">Latest sample</p>
                  <h2 className="text-xl font-semibold text-gray-900">Response payload</h2>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Pulled from <code className="bg-gray-200 px-2 py-0.5 rounded">example_resp_message.json</code>. 
                Great for quickly checking temperature, tool usage, and instructions applied to a run.
              </p>
              <ResponsesTable response={responseData.response} />
            </section>

            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
              <ResponseView
                response={responseData.response}
                loading={responseData.loading}
                error={responseData.error}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
