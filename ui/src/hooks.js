import { useState, useEffect } from 'react'
import { parseErrorResponse } from './utils'

export function useAgents(config) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  const fetchAgents = async () => {
    const { project, limit, order, mode } = config
    if (!project) return

    const params = new URLSearchParams({ project })
    if (limit) params.set('limit', limit)
    if (order) params.set('order', order)
    if (mode === 'legacy') params.set('mode', 'legacy')

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agents?${params}`)
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to load agents')
      }
      const data = await response.json()
      setAgents(data.agents || [])
      setFetchedAt(data.fetchedAt)
    } catch (err) {
      setError(err.message)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config.project) {
      fetchAgents()
    }
  }, [config.project, config.limit, config.order, config.mode])

  return { agents, loading, error, fetchedAt, refresh: fetchAgents }
}

export function useConversations(config) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [pagination, setPagination] = useState({
    hasMore: false,
    firstId: null,
    lastId: null,
    cursorHistory: [], // Stack of cursors for going back
    currentCursor: null
  })

  const fetchConversations = async (cursor = null, direction = 'next') => {
    const { project, limit = 20, order } = config
    if (!project) return

    const params = new URLSearchParams({ project })
    params.set('limit', limit)
    if (order) params.set('order', order)
    
    if (cursor) {
      if (direction === 'next') {
        params.set('after', cursor)
      } else {
        params.set('before', cursor)
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations?${params}`)
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to load conversations')
      }
      const data = await response.json()
      setConversations(data.conversations || [])
      setFetchedAt(data.fetchedAt)
      setPagination(prev => ({
        hasMore: data.has_more ?? false,
        firstId: data.first_id,
        lastId: data.last_id,
        cursorHistory: direction === 'next' && cursor 
          ? [...prev.cursorHistory, prev.firstId]
          : direction === 'prev' 
            ? prev.cursorHistory.slice(0, -1)
            : [],
        currentCursor: cursor
      }))
    } catch (err) {
      setError(err.message)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const nextPage = () => {
    if (pagination.hasMore && pagination.lastId) {
      fetchConversations(pagination.lastId, 'next')
    }
  }

  const prevPage = () => {
    if (pagination.cursorHistory.length > 0) {
      const prevCursor = pagination.cursorHistory[pagination.cursorHistory.length - 1]
      fetchConversations(prevCursor, 'prev')
    } else if (pagination.currentCursor) {
      // Go back to first page
      fetchConversations(null, 'first')
    }
  }

  const firstPage = () => {
    fetchConversations(null, 'first')
  }

  useEffect(() => {
    if (config.project) {
      fetchConversations()
    }
  }, [config.project, config.limit, config.order])

  return { 
    conversations, 
    loading, 
    error, 
    fetchedAt, 
    refresh: () => fetchConversations(),
    pagination: {
      hasMore: pagination.hasMore,
      hasPrev: pagination.cursorHistory.length > 0 || pagination.currentCursor !== null,
      currentPage: pagination.cursorHistory.length + 1
    },
    nextPage,
    prevPage,
    firstPage
  }
}

export function useConversationDetails(config, conversationId) {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!conversationId || !config.project) {
      setItems(null)
      setError(null)
      return
    }

    const fetchDetails = async () => {
      const params = new URLSearchParams({ 
        project: config.project,
        limit: '100',
        order: 'asc'
      })

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/conversations/${conversationId}/items?${params}`)
        if (!response.ok) {
          await parseErrorResponse(response, 'Failed to load conversation details')
        }
        const data = await response.json()
        // Handle different response structures
        const itemsList = data.data || data.items || data || []
        setItems(Array.isArray(itemsList) ? itemsList : [])
      } catch (err) {
        setError(err.message)
        setItems(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [config.project, conversationId])

  return { items, loading, error }
}

export function useConversationMutations(config, onSuccess) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createConversation = async () => {
    const { project } = config
    if (!project) return null

    const params = new URLSearchParams({ project })

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to create conversation')
      }
      const data = await response.json()
      onSuccess?.()
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (conversationId) => {
    const { project } = config
    if (!project || !conversationId) return false

    const params = new URLSearchParams({ project })

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations/${conversationId}?${params}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to delete conversation')
      }
      onSuccess?.()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const bulkDeleteConversations = async (conversationIds) => {
    const { project } = config
    if (!project || !conversationIds?.length) return { success: [], failed: [] }

    const params = new URLSearchParams({ project })

    setLoading(true)
    setError(null)

    const results = { success: [], failed: [] }

    for (const id of conversationIds) {
      try {
        const response = await fetch(`/api/conversations/${id}?${params}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          results.success.push(id)
        } else {
          results.failed.push(id)
        }
      } catch {
        results.failed.push(id)
      }
    }

    if (results.failed.length > 0) {
      setError(`Failed to delete ${results.failed.length} conversation(s)`)
    }

    if (results.success.length > 0) {
      onSuccess?.()
    }

    setLoading(false)
    return results
  }

  const clearError = () => setError(null)

  return { createConversation, deleteConversation, bulkDeleteConversations, loading, error, clearError }
}

export function useResponses(config) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [pagination, setPagination] = useState({
    hasMore: false,
    firstId: null,
    lastId: null,
    cursorHistory: [],
    currentCursor: null
  })

  const fetchResponses = async (cursor = null, direction = 'next') => {
    const { project, limit = 20, order } = config
    if (!project) return

    const params = new URLSearchParams({ project })
    params.set('limit', limit)
    if (order) params.set('order', order)
    
    if (cursor) {
      if (direction === 'next') {
        params.set('after', cursor)
      } else {
        params.set('before', cursor)
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/responses?${params}`)
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to load responses')
      }
      const data = await response.json()
      setResponses(data.responses || [])
      setFetchedAt(data.fetchedAt)
      setPagination(prev => ({
        hasMore: data.has_more ?? false,
        firstId: data.first_id,
        lastId: data.last_id,
        cursorHistory: direction === 'next' && cursor 
          ? [...prev.cursorHistory, prev.firstId]
          : direction === 'prev' 
            ? prev.cursorHistory.slice(0, -1)
            : [],
        currentCursor: cursor
      }))
    } catch (err) {
      setError(err.message)
      setResponses([])
    } finally {
      setLoading(false)
    }
  }

  const nextPage = () => {
    if (pagination.hasMore && pagination.lastId) {
      fetchResponses(pagination.lastId, 'next')
    }
  }

  const prevPage = () => {
    if (pagination.cursorHistory.length > 0) {
      const prevCursor = pagination.cursorHistory[pagination.cursorHistory.length - 1]
      fetchResponses(prevCursor, 'prev')
    } else if (pagination.currentCursor) {
      fetchResponses(null, 'first')
    }
  }

  const firstPage = () => {
    fetchResponses(null, 'first')
  }

  useEffect(() => {
    if (config.project) {
      fetchResponses()
    }
  }, [config.project, config.limit, config.order])

  return { 
    responses, 
    loading, 
    error, 
    fetchedAt, 
    refresh: () => fetchResponses(),
    pagination: {
      hasMore: pagination.hasMore,
      hasPrev: pagination.cursorHistory.length > 0 || pagination.currentCursor !== null,
      currentPage: pagination.cursorHistory.length + 1
    },
    nextPage,
    prevPage,
    firstPage
  }
}

export function useResponseMutations(config, onSuccess) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteResponse = async (responseId) => {
    const { project } = config
    if (!project || !responseId) return false

    const params = new URLSearchParams({ project })

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/responses/${responseId}?${params}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        await parseErrorResponse(response, 'Failed to delete response')
      }
      onSuccess?.()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const bulkDeleteResponses = async (responseIds) => {
    const { project } = config
    if (!project || !responseIds?.length) return { success: [], failed: [] }

    const params = new URLSearchParams({ project })

    setLoading(true)
    setError(null)

    const results = { success: [], failed: [] }

    for (const id of responseIds) {
      try {
        const response = await fetch(`/api/responses/${id}?${params}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          results.success.push(id)
        } else {
          results.failed.push(id)
        }
      } catch {
        results.failed.push(id)
      }
    }

    if (results.failed.length > 0) {
      setError(`Failed to delete ${results.failed.length} response(s)`)
    }

    if (results.success.length > 0) {
      onSuccess?.()
    }

    setLoading(false)
    return results
  }

  const clearError = () => setError(null)

  return { deleteResponse, bulkDeleteResponses, loading, error, clearError }
}

export function useResponseDetails(config, responseId) {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!responseId || !config.project) {
      setResponse(null)
      setError(null)
      return
    }

    const fetchDetails = async () => {
      const params = new URLSearchParams({ project: config.project })

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/responses/${responseId}?${params}`)
        if (!res.ok) {
          await parseErrorResponse(res, 'Failed to load response details')
        }
        const data = await res.json()
        setResponse(data)
      } catch (err) {
        setError(err.message)
        setResponse(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [config.project, responseId])

  return { response, loading, error }
}
