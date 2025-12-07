import { useState } from 'react'
import { formatDate } from '../utils'

export function ConversationCard({ conversation }) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4 shadow-md hover:shadow-lg transition-shadow">
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{conversation.id || 'Unknown id'}</p>
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Object Type</p>
          <p className="text-gray-900">{conversation.object || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Created</p>
          <p className="text-gray-900">{formatDate(conversation.created)}</p>
        </div>
      </div>
    </article>
  )
}

export function ConversationsList({ conversations, loading, error }) {
  if (loading) {
    return <div className="text-center text-gray-600 py-8">Loading conversations…</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>
  }

  if (conversations.length === 0) {
    return <div className="text-center text-gray-600 py-8 border border-dashed border-gray-300 rounded-xl">No conversations returned for the current filters.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {conversations.map(conversation => (
        <ConversationCard key={conversation.id} conversation={conversation} />
      ))}
    </div>
  )
}

export function ConversationsTable({ conversations, selectedConversation, onSelectConversation }) {
  if (conversations.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="2" className="px-4 py-8 text-center text-gray-600">No conversations loaded yet.</td>
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
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {conversations.slice(0, 20).map(conversation => (
            <tr 
              key={conversation.id} 
              onClick={() => onSelectConversation(conversation)}
              className={`cursor-pointer transition-colors ${
                selectedConversation?.id === conversation.id 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <td className="px-4 py-3 text-sm text-gray-900">{conversation.id || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(conversation.created)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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

// Render a single conversation item based on its type
function ConversationItem({ item, showJson }) {
  const [expanded, setExpanded] = useState(false)
  const itemType = item.type || 'unknown'
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

export function ConversationDetail({ conversation, items, loading, error }) {
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!conversation) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
        Select a conversation from the table above to view details
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 text-center text-gray-600">
        Loading conversation details…
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
    const fullData = { conversation, items }
    await navigator.clipboard.writeText(JSON.stringify(fullData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sortedItems = items ? [...items].sort((a, b) => {
    const aTime = a.created_at || 0
    const bTime = b.created_at || 0
    return aTime - bTime
  }) : []

  if (showJson) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-4 flex justify-between items-center border-b border-gray-200">
          <button
            onClick={() => setShowJson(false)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            ← Back to Timeline
          </button>
          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
        </div>
        <pre className="p-4 text-xs overflow-auto max-h-[600px] bg-gray-50">
          {JSON.stringify({ conversation, items }, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-baseline gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>
          <span className="text-sm text-gray-500 font-mono">{conversation.id}</span>
        </div>
        <button
          onClick={() => setShowJson(true)}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          View JSON
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-4 text-sm text-gray-600">
          {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} in timeline
        </div>
        
        <div className="space-y-3">
          {sortedItems.map((item, index) => (
            <ConversationItem key={item.id || index} item={item} showJson={false} />
          ))}
        </div>
        
        {sortedItems.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No items in this conversation
          </div>
        )}
      </div>
    </div>
  )
}
