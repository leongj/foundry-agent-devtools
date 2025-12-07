import { useState, useEffect } from 'react'

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
        const text = await response.text()
        try {
          const payload = JSON.parse(text)
          throw new Error(payload.error || 'Failed to load agents')
        } catch {
          throw new Error(text || 'Failed to load agents')
        }
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

  const fetchConversations = async () => {
    const { project, limit, order } = config
    if (!project) return

    const params = new URLSearchParams({ project })
    if (limit) params.set('limit', limit)
    if (order) params.set('order', order)

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations?${params}`)
      if (!response.ok) {
        const text = await response.text()
        try {
          const payload = JSON.parse(text)
          throw new Error(payload.error || 'Failed to load conversations')
        } catch {
          throw new Error(text || 'Failed to load conversations')
        }
      }
      const data = await response.json()
      setConversations(data.conversations || [])
      setFetchedAt(data.fetchedAt)
    } catch (err) {
      setError(err.message)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config.project) {
      fetchConversations()
    }
  }, [config.project, config.limit, config.order])

  return { conversations, loading, error, fetchedAt, refresh: fetchConversations }
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
          const text = await response.text()
          try {
            const payload = JSON.parse(text)
            throw new Error(payload.error || 'Failed to load conversation details')
          } catch {
            throw new Error(text || 'Failed to load conversation details')
          }
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

export function useResponse() {
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadedAt, setLoadedAt] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/examples/response')
        if (!res.ok) throw new Error('Failed to load sample response')
        const payload = await res.json()
        setResponse(payload)
        setLoadedAt(new Date().toISOString())
      } catch (err) {
        setError(err.message)
        setResponse(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return { response, loading, error, loadedAt }
}
