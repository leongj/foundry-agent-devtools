import { useState, useEffect } from 'react'
import { formatDate, extractContentText, truncateText } from '../utils'
import { TimelineItem } from './TimelineItem'

export function ResponsesTable({ 
  responses, 
  selectedResponse, 
  onSelectResponse,
  onDeleteResponse,
  onBulkDeleteResponses,
  mutationLoading,
  mutationError,
  onClearError,
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

  // Clear selection when responses change (page change)
  useEffect(() => {
    setSelectedIds(new Set())
  }, [responses])

  const handleDeleteClick = (e, response) => {
    e.stopPropagation()
    setDeleteConfirmId(response.id)
  }

  const handleConfirmDelete = async (e) => {
    e.stopPropagation()
    if (deleteConfirmId) {
      await onDeleteResponse(deleteConfirmId)
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

  const handleCheckboxChange = (e, responseId) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(responseId)) {
        next.delete(responseId)
      } else {
        next.add(responseId)
      }
      return next
    })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(responses.map(r => r.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkDeleteClick = () => {
    setBulkDeleteConfirm(true)
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size > 0) {
      await onBulkDeleteResponses(Array.from(selectedIds))
      setSelectedIds(new Set())
      setBulkDeleteConfirm(false)
    }
  }

  const handleCancelBulkDelete = () => {
    setBulkDeleteConfirm(false)
  }

  const allSelected = responses.length > 0 && 
    responses.every(r => selectedIds.has(r.id))
  const someSelected = selectedIds.size > 0

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
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700 text-sm">
            Delete {selectedIds.size} response{selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.
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
            Delete response <span className="font-mono">{deleteConfirmId.slice(0, 20)}...</span>?
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
      {responses.length === 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Preview</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-600">No responses loaded yet.</td>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Preview</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {responses.map(response => (
                <tr 
                  key={response.id} 
                  onClick={() => onSelectResponse(response)}
                  className={`cursor-pointer transition-colors ${
                    selectedResponse?.id === response.id 
                      ? 'bg-blue-50 hover:bg-blue-100' 
                      : selectedIds.has(response.id)
                        ? 'bg-orange-50 hover:bg-orange-100'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(response.id)}
                      onChange={(e) => handleCheckboxChange(e, response.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{response.id || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{response.status || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(response.created_at * 1000)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{truncateText(getContentPreview(response), 60)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => handleDeleteClick(e, response)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Delete response"
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
      {responses.length > 0 && (
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
