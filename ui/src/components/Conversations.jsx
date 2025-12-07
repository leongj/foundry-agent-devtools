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

export function ConversationsTable({ conversations }) {
  if (conversations.length === 0) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Object</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="3" className="px-4 py-8 text-center text-gray-600">No conversations loaded yet.</td>
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
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Object</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {conversations.slice(0, 20).map(conversation => (
            <tr key={conversation.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700">{conversation.id || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{conversation.object || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(conversation.created)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
