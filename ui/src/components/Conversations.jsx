import { useState } from 'react'
import { formatDate } from '../utils'
import { TimelineItem } from './TimelineItem'

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
              <td className="px-4 py-3 text-sm text-gray-700">{formatDate(conversation.created_at * 1000)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
            <TimelineItem key={item.id || index} item={item} showJson={false} />
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
