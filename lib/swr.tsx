'use client'
import React from 'react'
import { SWRConfig } from 'swr'

export const fetcher = (url: string) => fetch(url).then(res => res.json())

function localStorageProvider() {
  if (typeof window === 'undefined') return new Map()
  const map = new Map<string, any>(JSON.parse(localStorage.getItem('swr-cache') || '[]'))
  window.addEventListener('beforeunload', () => {
    const cache = JSON.stringify(Array.from(map.entries()))
    localStorage.setItem('swr-cache', cache)
  })
  return map
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, refreshInterval: 30000, provider: localStorageProvider }}>
      {children}
    </SWRConfig>
  )
}

