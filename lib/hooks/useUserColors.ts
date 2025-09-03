import { useMemo } from 'react'

interface Event {
  owner?: string
}

const PALETTE = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
]

export default function useUserColors(events: Event[]): Record<string, string> {
  return useMemo(() => {
    const owners = Array.from(new Set(events.map(e => e.owner).filter(Boolean))) as string[]
    const map: Record<string, string> = {}
    owners.forEach((owner, idx) => {
      map[owner] = PALETTE[idx % PALETTE.length]
    })
    return map
  }, [events])
}

