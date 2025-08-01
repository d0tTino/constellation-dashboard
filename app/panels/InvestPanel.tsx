'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useSocket } from '../socket-context'

type Point = {
  time: number
  value: number
}

export default function InvestPanel() {
  const socket = useSocket()
  const [data, setData] = useState<Point[]>([])

  useEffect(() => {
    if (!socket) return

    const handle = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data)
        if (typeof msg.value === 'number') {
          setData(d => [...d, { time: Date.now(), value: msg.value }].slice(-50))
        }
      } catch {
        // ignore
      }
    }

    socket.addEventListener('message', handle)
    return () => socket.removeEventListener('message', handle)
  }, [socket])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Invest</h1>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="time" domain={['dataMin', 'dataMax']} type="number" tickFormatter={t => new Date(t).toLocaleTimeString()} />
        <YAxis />
        <Tooltip labelFormatter={label => new Date(Number(label)).toLocaleTimeString()} />
        <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} isAnimationActive={false} />
      </LineChart>
    </div>
  )
}
