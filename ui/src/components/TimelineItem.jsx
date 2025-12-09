import { useState } from 'react'
import { formatDate, extractContentText, countAnnotations } from '../utils'
import { ClickableId } from './ClickableId'

export function TimelineItem({ item, showJson }) {
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
