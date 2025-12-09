import { useState } from 'react'
import { formatDate, extractContentText, truncateText } from '../utils'
import { TimelineItem } from './TimelineItem'

export function ResponsesTable({ responses, selectedResponse, onSelectResponse }) {
  if (responses.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Preview</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" className="px-4 py-8 text-center text-gray-600">No responses loaded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  const getContentPreview = (resp) => {
    if (!Array.isArray(resp?.output)) return ''
    for (const entry of resp.output) {
      if (!Array.isArray(entry?.content)) continue
      for (const chunk of entry.content) {
        if (chunk?.type === 'output_text' && chunk.text) {
          return chunk.text
        }
      }
    }
    return ''
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Preview</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {responses.slice(0, 20).map(response => (
            <tr 
              key={response.id} 
              onClick={() => onSelectResponse(response)}
              className={`cursor-pointer transition-colors ${
                selectedResponse?.id === response.id 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <td className="px-4 py-3 text-sm text-gray-900">{response.id || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{response.status || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(response.created_at * 1000)}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{truncateText(getContentPreview(response), 60)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AttributeGroup({ title, entries }) {
  const validEntries = entries.filter(([, value]) => value !== undefined && value !== null && value !== '')
  
  if (validEntries.length === 0) return null

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">{title}</h4>
      <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {validEntries.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 break-words">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ToolsSection({ response }) {
  const tools = response.tools || []
  const toolChoice = typeof response.tool_choice === 'string'
    ? response.tool_choice
    : response.tool_choice?.type
  const parallelToolCalls = response.parallel_tool_calls

  if (tools.length === 0 && !toolChoice && parallelToolCalls === undefined) return null

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Tools ({tools.length})</h4>
      
      {/* Tool Choice and Parallel Calls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {toolChoice && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">Tool Choice</dt>
            <dd className="text-sm font-medium text-gray-900">{toolChoice}</dd>
          </div>
        )}
        {parallelToolCalls !== undefined && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">Parallel Tool Calls</dt>
            <dd className="text-sm font-medium text-gray-900">{String(parallelToolCalls)}</dd>
          </div>
        )}
      </div>

      {/* Individual Tools */}
      {tools.length === 0 ? (
        <p className="text-sm text-gray-500">No tools configured</p>
      ) : (
        <div className="space-y-2">
          {tools.map((tool, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded text-sm hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900">{tool.type}</div>
              <pre className="text-xs overflow-auto bg-white p-2 rounded border border-gray-200">
                {JSON.stringify(tool, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResponseSummary({ response }) {
  const basicInfo = [
    ['Status', response.status],
    ['Background', response.background !== undefined ? String(response.background) : undefined],
    ['Conversation ID', response.conversation?.id]
  ]

  const agentInfo = [
    ['Agent Name', response.agent?.name],
    ['Agent Version', response.agent?.version]
  ]

  const modelSettings = [
    ['Model', response.model],
    ['Temperature', response.temperature],
    ['Top P', response.top_p],
    ['Service Tier', response.service_tier],
    ['Top Logprobs', response.top_logprobs],
    ['Truncation', response.truncation]
  ]

  const usage = [
    ['Total Tokens', response.usage?.total_tokens],
    ['Input Tokens', response.usage?.input_tokens],
    ['Output Tokens', response.usage?.output_tokens],
    ['Cached Tokens', response.usage?.input_token_details?.cached_tokens],
    ['Reasoning Tokens', response.usage?.output_token_details?.reasoning_tokens]
  ]

  const errorInfo = response.error ? [
    ['Error', response.error]
  ] : []

  const incompleteInfo = response.incomplete_details ? [
    ['Incomplete Details', JSON.stringify(response.incomplete_details)]
  ] : []

  return (
    <div className="space-y-6">
      <AttributeGroup title="Basic Information" entries={basicInfo} />
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Agent</h4>
        <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {agentInfo.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</dt>
              <dd className="text-sm font-medium text-gray-900 break-words">{String(value)}</dd>
            </div>
          ))}
        </dl>
        {response.instructions && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h5 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Instructions</h5>
            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{response.instructions}</p>
          </div>
        )}
      </div>
      <AttributeGroup title="Model Settings" entries={modelSettings} />
      <ToolsSection response={response} />
      <AttributeGroup title="Token Usage" entries={usage} />
      {errorInfo.length > 0 && <AttributeGroup title="Error" entries={errorInfo} />}
      {incompleteInfo.length > 0 && <AttributeGroup title="Incomplete Details" entries={incompleteInfo} />}
    </div>
  )
}

function ResponseOutputItems({ response, showJson }) {
  const items = Array.isArray(response?.output) ? response.output : []

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
        No output items
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <TimelineItem key={item.id || idx} item={item} showJson={showJson} />
      ))}
    </div>
  )
}

export function ResponseDetail({ response, loading, error }) {
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!response) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
        Select a response from the table above to view details
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 text-center text-gray-600">
        Loading response details…
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-red-200 rounded-xl p-8 text-center text-red-600">
        Error loading details: {error}
      </div>
    )
  }

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2))
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
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-baseline gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Response</h3>
          <span className="text-sm text-gray-500 font-mono">{response.id}</span>
          <span className="text-sm text-gray-500">· {formatDate(response.created_at * 1000)}</span>
        </div>
        <button
          onClick={() => setShowJson(true)}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          View JSON
        </button>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Output</h3>
          <ResponseOutputItems response={response} showJson={showJson} />
        </div>
        <ResponseSummary response={response} />
      </div>
    </div>
  )
}
