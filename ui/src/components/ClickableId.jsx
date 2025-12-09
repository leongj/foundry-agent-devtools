import { useState } from 'react'

export function ClickableId({ label, id }) {
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className="relative inline-block">
      <span
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-pointer hover:text-gray-700 transition-colors"
      >
        {label}: {id}
      </span>
      {(showTooltip || copied) && (
        <span className="absolute left-0 -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {copied ? '✓ Copied!' : 'Click to copy'}
        </span>
      )}
    </span>
  )
}
