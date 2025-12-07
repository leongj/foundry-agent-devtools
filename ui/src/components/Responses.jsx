import { useState } from 'react'
import { formatDate, extractTextFromContent, truncateText } from '../utils'

// Helper to extract text from content chunks
function extractContentText(content) {
  if (!content) return ''
  if (typeof content === 'string') return content
  
  const chunks = Array.isArray(content) ? content : [content]
  const texts = []
  
  for (const chunk of chunks) {
    if (typeof chunk === 'string') {
      texts.push(chunk)
    } else if (chunk?.text) {
      texts.push(typeof chunk.text === 'string' ? chunk.text : chunk.text?.value || '')
    } else if (chunk?.value) {
      texts.push(String(chunk.value))
    } else if (chunk?.type === 'input_text' || chunk?.type === 'output_text') {
      texts.push(chunk.text || '')
    }
  }
  
  return texts.filter(Boolean).join('\n\n')
}

// Helper to count annotations/citations
function countAnnotations(content) {
  if (!Array.isArray(content)) return 0
  let count = 0
  for (const chunk of content) {
    const annotations = chunk?.text?.annotations || chunk?.annotations || []
    count += annotations.length
  }
  return count
}

// Clickable ID component with copy-to-clipboard and tooltip
function ClickableId({ label, id }) {
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className="relative inline-block">
      <span
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-pointer hover:text-gray-700 transition-colors"
      >
        {label}: {id}
      </span>
      {(showTooltip || copied) && (
        <span className="absolute left-0 -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {copied ? '✓ Copied!' : 'Click to copy'}
        </span>
      )}
    </span>
  )
}

// Render a single output item based on its type
function OutputItem({ item, showJson }) {
  const [expanded, setExpanded] = useState(false)
  const itemType = item.type || 'message'
  const timestamp = item.created_at ? formatDate(item.created_at * 1000) : ''
  const role = item.role || ''
  
  // Build header info
  const headerParts = []
  if (timestamp) headerParts.push(timestamp)
  if (role) headerParts.push(role)
  if (itemType !== 'message') headerParts.push(`[${itemType}]`)
  
  const messageId = item.id
  const responseId = item.created_by?.response_id
  const callId = item.call_id
  
  if (showJson) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div className="text-xs text-gray-600 mb-2">{headerParts.join(' · ')}</div>
        <pre className="text-xs overflow-auto bg-white p-2 rounded border border-gray-200">
          {JSON.stringify(item, null, 2)}
        </pre>
      </div>
    )
  }

  // Render based on type
  if (itemType === 'message') {
    const text = extractContentText(item.content)
    const annotationCount = countAnnotations(item.content)
    const attachmentCount = Array.isArray(item.attachments) ? item.attachments.length : 0
    
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-200 transition-colors">
        <div className="text-xs text-gray-500 mb-2 space-x-2">
          <span className="text-gray-900 font-medium">{headerParts.join(' · ')}</span>
          {messageId && <ClickableId label="id" id={messageId} />}
          {responseId && <ClickableId label="response" id={responseId} />}
          {callId && <ClickableId label="call" id={callId} />}
        </div>
        {text && (
          <div className="text-sm text-gray-900 whitespace-pre-wrap">{text}</div>
        )}
        {(annotationCount > 0 || attachmentCount > 0) && (
          <div className="mt-2 text-xs text-gray-500">
            {annotationCount > 0 && <span>{annotationCount} citation{annotationCount > 1 ? 's' : ''}</span>}
            {annotationCount > 0 && attachmentCount > 0 && <span> · </span>}
            {attachmentCount > 0 && <span>{attachmentCount} attachment{attachmentCount > 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>
    )
  }
  
  if (itemType === 'file_search_call') {
    const queries = item.queries || []
    const results = item.results || []
    
    return (
      <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 hover:bg-blue-100 transition-colors">
        <div className="text-xs text-gray-500 mb-2 space-x-2">
          <span className="text-gray-900 font-medium">{headerParts.join(' · ')}</span>
          {messageId && <ClickableId label="id" id={messageId} />}
          {responseId && <ClickableId label="response" id={responseId} />}
          {callId && <ClickableId label="call" id={callId} />}
        </div>
        <div className="text-sm font-medium text-gray-900 mb-1">File Search</div>
        {queries.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-gray-600 mb-1">Queries:</div>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {queries.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        )}
        {results.length > 0 && (
          <div className="text-xs text-gray-600 mb-2">{results.length} result{results.length > 1 ? 's' : ''} found</div>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
        {expanded && (
          <pre className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto">
            {JSON.stringify(item, null, 2)}
          </pre>
        )}
      </div>
    )
  }
  
  if (itemType === 'code_interpreter_call') {
    const code = item.code || ''
    const outputs = item.outputs || []
    
    return (
      <div className="border border-green-200 rounded-lg p-3 bg-green-50 hover:bg-green-100 transition-colors">
        <div className="text-xs text-gray-500 mb-2 space-x-2">
          <span className="text-gray-900 font-medium">{headerParts.join(' · ')}</span>
          {messageId && <ClickableId label="id" id={messageId} />}
          {responseId && <ClickableId label="response" id={responseId} />}
          {callId && <ClickableId label="call" id={callId} />}
        </div>
        <div className="text-sm font-medium text-gray-900 mb-1">Code Interpreter</div>
        {code && (
          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto mb-2">
            {code}
          </pre>
        )}
        {outputs.length > 0 && (
          <div className="text-xs text-gray-600 mb-2">{outputs.length} output{outputs.length > 1 ? 's' : ''}</div>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
        {expanded && (
          <pre className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto">
            {JSON.stringify(item, null, 2)}
          </pre>
        )}
      </div>
    )
  }
  
  // Generic fallback for unknown types
  return (
    <div className="border border-purple-200 rounded-lg p-3 bg-purple-50 hover:bg-purple-100 transition-colors">
      <div className="text-xs text-gray-500 mb-2 space-x-2">
        <span className="text-gray-900 font-medium">{headerParts.join(' · ')}</span>
        {messageId && <ClickableId label="id" id={messageId} />}
        {responseId && <ClickableId label="response" id={responseId} />}
        {callId && <ClickableId label="call" id={callId} />}
      </div>
      <div className="text-sm font-medium text-gray-900 mb-2">Unknown Type: {itemType}</div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
      >
        {expanded ? 'Hide details' : 'Show details'}
      </button>
      {expanded && (
        <pre className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto">
          {JSON.stringify(item, null, 2)}
        </pre>
      )}
    </div>
  )
}

export function ResponseCard({ response }) {
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

  const preview = truncateText(getContentPreview(response), 80)

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4 shadow-md hover:shadow-lg transition-shadow">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{response.id || 'Unknown id'}</p>
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Status</p>
          <p className="text-gray-900">{response.status || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Created</p>
          <p className="text-gray-900">{formatDate(response.created_at * 1000)}</p>
        </div>
        {preview && (
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Preview</p>
            <p className="text-gray-700 text-xs">{preview}</p>
          </div>
        )}
      </div>
    </article>
  )
}

export function ResponsesList({ responses, loading, error }) {
  if (loading) {
    return <div className="text-center text-gray-600 py-8">Loading responses…</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>
  }

  if (responses.length === 0) {
    return <div className="text-center text-gray-600 py-8 border border-dashed border-gray-300 rounded-xl">No responses returned for the current filters.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {responses.map(response => (
        <ResponseCard key={response.id} response={response} />
      ))}
    </div>
  )
}

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
        <OutputItem key={item.id || idx} item={item} showJson={showJson} />
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
