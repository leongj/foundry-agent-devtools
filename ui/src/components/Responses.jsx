import { formatDate, extractTextFromContent, truncateText } from '../utils'

function ResponseSummary({ response }) {
  const toolChoice = typeof response.tool_choice === 'string'
    ? response.tool_choice
    : response.tool_choice?.type

  const entries = [
    ['Response ID', response.id],
    ['Status', response.status],
    ['Agent', response.agent?.name || response.agent?.type],
    ['Conversation', response.conversation?.id],
    ['Temperature', response.temperature],
    ['Tool choice', toolChoice],
    ['Created', response.created_at ? formatDate(
      typeof response.created_at === 'number'
        ? new Date(response.created_at * 1000)
        : response.created_at
    ) : null],
    ['Total tokens', response.usage?.total_tokens],
    ['Output tokens', response.usage?.output_tokens],
    ['Input tokens', response.usage?.input_tokens]
  ].filter(([, value]) => value !== undefined && value !== null && value !== '')

  if (entries.length === 0) {
    return <div className="text-center text-gray-600 py-4">No metadata available in sample payload.</div>
  }

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
    : 'No assistant output found in sample payload.'

  return (
    <pre className="bg-white border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap break-words font-mono text-gray-900">
      {text}
    </pre>
  )
}

export function ResponseView({ response, loading, error }) {
  if (loading) {
    return <div className="text-center text-gray-600 py-8">Loading sample response…</div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>
  }

  if (!response) {
    return <div className="text-center text-gray-600 py-8 border border-dashed border-gray-300 rounded-xl">No response data available.</div>
  }

  return (
    <div className="space-y-6">
      <ResponseSummary response={response} />
      <ResponseOutput response={response} />
    </div>
  )
}

export function ResponsesTable({ response }) {
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
              <td colSpan="5" className="px-4 py-8 text-center text-gray-600">No response output yet.</td>
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
