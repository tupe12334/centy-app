import { useCallback } from 'react'
import { toast } from 'sonner'

export function useCopyToClipboard() {
  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${label || text} to clipboard`)
      return true
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      toast.error('Failed to copy to clipboard')
      return false
    }
  }, [])

  return { copyToClipboard }
}
