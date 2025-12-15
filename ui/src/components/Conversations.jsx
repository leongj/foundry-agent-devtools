import { useState, useEffect } from 'react'
import { formatDate } from '../utils'
import { TimelineItem } from './TimelineItem'

export function ConversationsTable({ 
  conversations, 
  selectedConversation, 
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onBulkDeleteConversations,
  mutationLoading,
  mutationError,
  onClearError,
  loadError,
  activeIdSearch,
  onApplyIdSearch,
  pagination,
  onNextPage,
  onPrevPage,
  onFirstPage,
  loading,
  itemsPerPage,
  onItemsPerPageChange
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [searchDraft, setSearchDraft] = useState(activeIdSearch || '')
  const [searchRequested, setSearchRequested] = useState(false)

  // Clear selection when conversations change (page change)
  useEffect(() => {
    setSelectedIds(new Set())
  }, [conversations])

  useEffect(() => {
    setSearchDraft(activeIdSearch || '')
  }, [activeIdSearch])

  const isSearchMode = (activeIdSearch || '').trim().length > 0
  const isSearching = (isSearchMode || searchRequested) && loading

  useEffect(() => {
    if (!loading) setSearchRequested(false)
  }, [loading])

  const applySearch = () => {
    setSearchRequested(true)
    onApplyIdSearch?.(searchDraft)
  }

  const clearSearch = () => {
    setSearchDraft('')
    setSearchRequested(false)
    onApplyIdSearch?.('')
  }

  const handleDeleteClick = (e, conversation) => {
    e.stopPropagation()
    setDeleteConfirmId(conversation.id)
  }

  const handleConfirmDelete = async (e) => {
    e.stopPropagation()
    if (deleteConfirmId) {
      await onDeleteConversation(deleteConfirmId)
      setDeleteConfirmId(null)
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(deleteConfirmId)
        return next
      })
    }
  }

  const handleCancelDelete = (e) => {
    e.stopPropagation()
    setDeleteConfirmId(null)
  }

  const handleCheckboxChange = (e, conversationId) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(conversationId)) {
        next.delete(conversationId)
      } else {
        next.add(conversationId)
      }
      return next
    })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(conversations.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkDeleteClick = () => {
    setBulkDeleteConfirm(true)
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size > 0) {
      await onBulkDeleteConversations(Array.from(selectedIds))
      setSelectedIds(new Set())
      setBulkDeleteConfirm(false)
    }
  }

  const handleCancelBulkDelete = () => {
    setBulkDeleteConfirm(false)
  }

  const allSelected = conversations.length > 0 && 
    conversations.every(c => selectedIds.has(c.id))
  const someSelected = selectedIds.size > 0

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateConversation}
            disabled={mutationLoading}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {mutationLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Creating...
              </>
            ) : (
              <>
                <span>+</span>
                New Conversation
              </>
            )}
          </button>
          {someSelected && (
            <button
              onClick={handleBulkDeleteClick}
              disabled={mutationLoading}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              🗑️ Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applySearch()
                }
              }}
              placeholder="Search by conversation ID (partial match)"
              className="w-72 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              onClick={applySearch}
              disabled={mutationLoading || isSearching}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors flex items-center gap-2"
            >
              {isSearching && (
                <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              )}
              {isSearching ? 'Searching…' : 'Search'}
            </button>
            {isSearchMode && (
              <button
                onClick={clearSearch}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {mutationError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <span>⚠️ {mutationError}</span>
              <button 
                onClick={onClearError}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          )}

          {loadError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <span>⚠️ {loadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700 text-sm">
            Delete {selectedIds.size} conversation{selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCancelBulkDelete}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBulkDelete}
              disabled={mutationLoading}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors"
            >
              {mutationLoading ? 'Deleting...' : `Delete ${selectedIds.size}`}
            </button>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Dialog */}
      {deleteConfirmId && !bulkDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700 text-sm">
            Delete conversation <span className="font-mono">{deleteConfirmId.slice(0, 20)}...</span>?
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCancelDelete}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={mutationLoading}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors"
            >
              {mutationLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {conversations.length === 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-600">
                  {isSearchMode ? 'No conversations match your search.' : 'No conversations loaded yet.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conversations.map(conversation => (
                <tr 
                  key={conversation.id} 
                  onClick={() => onSelectConversation(conversation)}
                  className={`cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-blue-50 hover:bg-blue-100' 
                      : selectedIds.has(conversation.id)
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(conversation.id)}
                      onChange={(e) => handleCheckboxChange(e, conversation.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{conversation.id || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(conversation.created_at * 1000)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => handleDeleteClick(e, conversation)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Delete conversation"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {conversations.length > 0 && !isSearchMode && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page {pagination?.currentPage || 1}
              {loading && <span className="ml-2 text-gray-400">Loading...</span>}
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                disabled={loading}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pagination?.hasPrev && (
              <>
                <button
                  onClick={onFirstPage}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-md transition-colors"
                >
                  ⏮ First
                </button>
                <button
                  onClick={onPrevPage}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-md transition-colors"
                >
                  ← Previous
                </button>
              </>
            )}
            {pagination?.hasMore && (
              <button
                onClick={onNextPage}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-md transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </div>
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
