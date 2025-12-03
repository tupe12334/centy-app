import { useState, useCallback } from 'react'

export function useCopyToClipboard(resetDelay = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = useCallback(
    async (text: string, id?: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopiedId(id ?? text)
        setTimeout(() => setCopiedId(null), resetDelay)
        return true
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
        return false
      }
    },
    [resetDelay]
  )

  return { copiedId, copyToClipboard }
}
