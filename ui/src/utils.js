export function formatDate(value) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

export function extractTextFromContent(content) {
  if (!Array.isArray(content)) return ''
  return content
    .map(chunk => chunk?.text)
    .filter(Boolean)
    .join('\n\n')
}

export function truncateText(value, max = 120) {
  if (!value) return ''
  const text = String(value).trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
