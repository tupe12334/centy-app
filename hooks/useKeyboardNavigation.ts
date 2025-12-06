'use client'

import { useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const NAVIGATION_PAGES = [
  '/issues',
  '/docs',
  '/assets',
  '/project/config',
  '/settings',
] as const

export function useKeyboardNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const getCurrentPageIndex = useCallback(() => {
    return NAVIGATION_PAGES.findIndex(page => pathname.startsWith(page))
  }, [pathname])

  const navigateToPage = useCallback(
    (direction: 'prev' | 'next') => {
      const currentIndex = getCurrentPageIndex()
      if (currentIndex === -1) return

      let newIndex: number
      if (direction === 'prev') {
        newIndex =
          currentIndex > 0 ? currentIndex - 1 : NAVIGATION_PAGES.length - 1
      } else {
        newIndex =
          currentIndex < NAVIGATION_PAGES.length - 1 ? currentIndex + 1 : 0
      }

      router.push(NAVIGATION_PAGES[newIndex])
    },
    [getCurrentPageIndex, router]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't navigate if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Don't navigate if modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        navigateToPage('prev')
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        navigateToPage('next')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateToPage])
}
