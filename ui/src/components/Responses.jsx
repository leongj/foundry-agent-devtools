import { useState } from 'react'
import { formatDate, extractTextFromContent, truncateText } from '../utils'

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

function ResponseSummary({ response }) {
  const toolChoice = typeof response.tool_choice === 'string'
    ? response.tool_choice
    : response.tool_choice?.type

  const entries = [
    ['Response ID', response.id],
    ['Status', response.status],
    ['Agent', response.agent?.name || response.agent?.type],
    ['Conversation', response.conversation?.id],
    ['Model', response.model],
    ['Temperature', response.temperature],
    ['Tool choice', toolChoice],
    ['Created', formatDate(response.created_at * 1000)],
    ['Total tokens', response.usage?.total_tokens],
    ['Output tokens', response.usage?.output_tokens],
    ['Input tokens', response.usage?.input_tokens]
  ].filter(([, value]) => value !== undefined && value !== null && value !== '')

  return (
    <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {entries.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</dt>
          <dd className="text-sm font-medium text-gray-900">{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function ResponseOutputTable({ response }) {
  const entries = Array.isArray(response?.output) ? response.output : []

  if (entries.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Preview</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center text-gray-600">No output entries.</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  const getPreview = (entry) => {
    if (Array.isArray(entry.content)) {
      return extractTextFromContent(entry.content)
    }
    return ''
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Preview</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.slice(0, 20).map((entry, idx) => (
            <tr key={entry.id || idx} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{entry.type || 'message'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{entry.role || 'assistant'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{entry.id || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{truncateText(getPreview(entry))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResponseOutput({ response }) {
  const outputs = []
  ;(response.output || []).forEach(entry => {
    if (entry.content && Array.isArray(entry.content)) {
      entry.content.forEach(chunk => {
        if (chunk.type === 'output_text' && chunk.text) {
          outputs.push(chunk.text)
        }
      })
    }
  })

  const text = outputs.length > 0
    ? outputs.join('\n\n')
    : 'No assistant output found.'

  return (
    <pre className="bg-white border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap break-words font-mono text-gray-900">
      {text}
    </pre>
  )
}

export function ResponseDetail({ response, loading, error }) {
  if (loading) {
    return <div className="text-center text-gray-600 py-8">Loading response details…</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>
  }

  if (!response) {
    return <div className="text-center text-gray-600 py-8 border border-dashed border-gray-300 rounded-xl">Select a response to view details.</div>
  }

  return (
    <div className="space-y-6">
      <ResponseSummary response={response} />
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Output</h3>
        <ResponseOutput response={response} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Output Entries</h3>
        <ResponseOutputTable response={response} />
      </div>
    </div>
  )
}
