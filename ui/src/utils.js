export function formatDate(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export function extractContentText(content) {
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

export function countAnnotations(content) {
  if (!Array.isArray(content)) return 0
  let count = 0
  for (const chunk of content) {
    const annotations = chunk?.text?.annotations || chunk?.annotations || []
    count += annotations.length
  }
  return count
}

export function truncateText(value, max = 120) {
  if (!value) return ''
  const text = String(value).trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export async function parseErrorResponse(response, defaultMessage) {
  const text = await response.text()
  try {
    const payload = JSON.parse(text)
    throw new Error(payload.error || defaultMessage)
  } catch (e) {
    if (e.message && e.message !== defaultMessage) {
      throw e
    }
    throw new Error(text || defaultMessage)
  }
}
