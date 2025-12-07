import { useState } from 'react'
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
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

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
  const metadata = latestVersion?.metadata || {}

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(agent, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (showJson) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-4 flex justify-between items-center border-b border-gray-200">
          <button
            onClick={() => setShowJson(false)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            ← Back to Details
          </button>
          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
        </div>
        <pre className="p-4 text-xs overflow-auto max-h-[600px] bg-gray-50">
          {JSON.stringify(agent, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-baseline gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
          <span className="text-sm text-gray-500">v{latestVersion?.version || '—'}</span>
        </div>
        <button
          onClick={() => setShowJson(true)}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          View JSON
        </button>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {/* Left Column */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">Model</h4>
            <p className="text-gray-900">{definition?.model || '—'}</p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">Created</h4>
            <p className="text-gray-900">{formatDate(latestVersion?.created_at * 1000)}</p>
            {latestVersion?.metadata?.modified_at && (
              <>
                <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-0.5 mt-2">Modified</h4>
                <p className="text-gray-900">{formatDate(parseInt(latestVersion.metadata.modified_at) * 1000)}</p>
              </>
            )}
          </div>
        </div>

        {/* Instructions - Full Width */}
        {definition?.instructions && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Instructions</h4>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{definition.instructions}</p>
          </div>
        )}

        {/* Description - Full Width */}
        {latestVersion?.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Description</h4>
            <p className="text-sm text-gray-900">{latestVersion.description}</p>
          </div>
        )}

        {/* Metadata Section */}
        {Object.keys(metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1.5">Metadata</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key}>
                  <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-0.5">{key}</h4>
                  <p className="text-gray-900">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools - Full Width */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1.5">Tools ({tools.length})</h4>
          {tools.length === 0 ? (
            <p className="text-sm text-gray-500">No tools configured</p>
          ) : (
            <div className="space-y-2">
              {tools.map((tool, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded text-sm">
                  <div className="font-medium text-gray-900">{tool.type}</div>
                  <pre className="text-xs overflow-auto bg-white p-2 rounded border border-gray-200">
                    {JSON.stringify(tool, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
