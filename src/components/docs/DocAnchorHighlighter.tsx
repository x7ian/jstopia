'use client'

import { useEffect } from 'react'
import { scrollToAnchor } from '@/lib/docs/scrollToAnchor'

export function DocAnchorHighlighter() {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      scrollToAnchor(hash)
    }

    function handleHashChange() {
      const next = window.location.hash.replace('#', '')
      if (next) {
        scrollToAnchor(next)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return null
}
