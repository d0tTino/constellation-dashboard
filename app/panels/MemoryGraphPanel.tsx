'use client'

import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'

const ForceGraph2D = dynamic(
  () => import('react-force-graph').then(mod => mod.ForceGraph2D),
  { ssr: false }
)

export default function MemoryGraphPanel() {
  const { data } = useSWR<{ nodes: any[]; edges: any[] }>('/api/memory/graph', fetcher)

  const graphData = {
    nodes: data?.nodes ?? [],
    links: data?.edges ?? [],
  }

  return (
    <div className="w-full h-[600px]">
      <ForceGraph2D graphData={graphData} />
    </div>
  )
}
