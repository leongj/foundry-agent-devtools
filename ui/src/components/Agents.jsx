import { formatDate } from '../utils'

function getAgentTools(agent) {
  const tools = agent?.versions?.latest?.definition?.tools || []
  if (tools.length === 0) return '—'
  return tools.map(tool => tool.type).join(', ')
}

export function AgentCard({ agent }) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4 shadow-md hover:shadow-lg transition-shadow">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{agent.id || 'Unknown id'}</p>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{agent.name || 'Unnamed agent'}</h3>
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Model</p>
          <p className="text-gray-900">{agent.model || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Created</p>
          <p className="text-gray-900">{formatDate(agent.created)}</p>
        </div>
      </div>
    </article>
  )
}

export function AgentsList({ agents, loading, error }) {
  if (loading) {
    return <div className="text-center text-gray-600 py-8">Loading agents…</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>
  }

  if (agents.length === 0) {
    return <div className="text-center text-gray-600 py-8 border border-dashed border-gray-300 rounded-xl">No agents returned for the current filters.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}

export function AgentsTable({ agents, selectedAgent, onSelectAgent }) {
  if (agents.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Model</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tools</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" className="px-4 py-8 text-center text-gray-600">No agents loaded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Model</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tools</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {agents.slice(0, 20).map(agent => (
            <tr 
              key={agent.id} 
              onClick={() => onSelectAgent(agent)}
              className={`cursor-pointer transition-colors ${
                selectedAgent?.id === agent.id 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <td className="px-4 py-3 text-sm text-gray-900">{agent.name || 'Unnamed agent'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{agent.versions?.latest?.definition?.model || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{getAgentTools(agent)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(agent.versions?.latest?.created_at * 1000)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AgentDetail({ agent }) {
  if (!agent) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
        Select an agent from the table above to view details
      </div>
    )
  }

  const latestVersion = agent.versions?.latest
  const definition = latestVersion?.definition
  const tools = definition?.tools || []

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{agent.name || 'Unnamed agent'}</h3>
        <p className="text-sm text-gray-600 mt-1">ID: {agent.id}</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Version Info */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Version</h4>
          <p className="text-sm text-gray-900">{latestVersion?.version || '—'}</p>
        </div>

        {/* Model */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Model</h4>
          <p className="text-sm text-gray-900">{definition?.model || '—'}</p>
        </div>

        {/* Instructions */}
        {definition?.instructions && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Instructions</h4>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{definition.instructions}</p>
          </div>
        )}

        {/* Description */}
        {latestVersion?.description && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Description</h4>
            <p className="text-sm text-gray-900">{latestVersion.description}</p>
          </div>
        )}

        {/* Tools */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Tools ({tools.length})</h4>
          {tools.length === 0 ? (
            <p className="text-sm text-gray-500">No tools configured</p>
          ) : (
            <div className="space-y-3">
              {tools.map((tool, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{tool.type}</p>
                  {tool.type === 'file_search' && tool.vector_store_ids && (
                    <p className="text-xs text-gray-600 mt-1">
                      Vector stores: {tool.vector_store_ids.join(', ')}
                    </p>
                  )}
                  {tool.type === 'code_interpreter' && tool.container?.file_ids && (
                    <p className="text-xs text-gray-600 mt-1">
                      Files: {tool.container.file_ids.length}
                    </p>
                  )}
                  {tool.type === 'bing_grounding' && tool.bing_grounding?.search_configurations && (
                    <p className="text-xs text-gray-600 mt-1">
                      Configurations: {tool.bing_grounding.search_configurations.length}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Created</h4>
            <p className="text-sm text-gray-900">{formatDate(latestVersion?.created_at * 1000)}</p>
          </div>
          {latestVersion?.metadata?.modified_at && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Modified</h4>
              <p className="text-sm text-gray-900">{formatDate(parseInt(latestVersion.metadata.modified_at) * 1000)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
