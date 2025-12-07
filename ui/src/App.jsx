import { useState, useEffect } from 'react'
import { useAgents, useConversations, useConversationDetails, useResponses, useResponseDetails } from './hooks'
import { AgentsList, AgentsTable, AgentDetail } from './components/Agents'
import { ConversationsList, ConversationsTable, ConversationDetail } from './components/Conversations'
import { ResponsesList, ResponsesTable, ResponseDetail } from './components/Responses'

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

function ConfigPanel({ config, onConfigChange, onRefresh }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onRefresh()
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Microsoft Foundry Project endpoint
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
      </form>
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
    project: saved.project || DEFAULT_PROJECT
  })
  const [activeTab, setActiveTab] = useState('agents')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [selectedResponse, setSelectedResponse] = useState(null)

  const agentsData = useAgents(config)
  const conversationsData = useConversations(config)
  const conversationDetailsData = useConversationDetails(config, selectedConversation?.id)
  const responsesData = useResponses(config)
  const responseDetailsData = useResponseDetails(config, selectedResponse?.id)

  useEffect(() => {
    saveSettings(config)
  }, [config])

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="space-y-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            Foundry Agent Service Explorer
          </h1>
          <p className="text-gray-600">A simple viewer for your Microsoft Foundry Agent Service project. Source code here: <a href="https://github.com/leongj/foundry-agent-devtools" className="text-blue-500 hover:underline">https://github.com/leongj/foundry-agent-devtools</a></p>
          <ConfigPanel
            config={config}
            onConfigChange={setConfig}
            onRefresh={agentsData.refresh}
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
                  <h2 className="text-xl font-semibold text-gray-900">Agent List</h2>
                </div>
                <div className="flex items-center gap-4">
                  {agentsData.fetchedAt && (
                    <span className="text-sm text-gray-600">
                      Last updated {new Date(agentsData.fetchedAt).toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={agentsData.refresh}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-medium transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <AgentsTable 
                agents={agentsData.agents} 
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
              />
            </section>

            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
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
                  <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
                </div>
                <div className="flex items-center gap-4">
                  {conversationsData.fetchedAt && (
                    <span className="text-sm text-gray-600">
                      Last updated {new Date(conversationsData.fetchedAt).toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={conversationsData.refresh}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-medium transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <ConversationsTable 
                conversations={conversationsData.conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={setSelectedConversation}
              />
            </section>

            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
              <ConversationDetail 
                conversation={selectedConversation}
                items={conversationDetailsData.items}
                loading={conversationDetailsData.loading}
                error={conversationDetailsData.error}
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
                  <h2 className="text-xl font-semibold text-gray-900">Responses</h2>
                </div>
                <div className="flex items-center gap-4">
                  {responsesData.fetchedAt && (
                    <span className="text-sm text-gray-600">
                      Last updated {new Date(responsesData.fetchedAt).toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={responsesData.refresh}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-medium transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <ResponsesTable 
                responses={responsesData.responses}
                selectedResponse={selectedResponse}
                onSelectResponse={setSelectedResponse}
              />
            </section>

            <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
              <ResponseDetail
                response={responseDetailsData.response}
                loading={responseDetailsData.loading}
                error={responseDetailsData.error}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
