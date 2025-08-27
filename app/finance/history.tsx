'use client'
import React, { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'
import { useFinanceUpdates } from '../socket-context'
import { getClientContext } from '../../lib/client-context'

type HistoryItem = {
  id: string
  date: string
  totalCost: number
}

type Action = { id: string; description: string }

export default function FinanceHistoryPage() {
  const [{ context, groupId }, setCtx] = useState(() => getClientContext())
  const { data, mutate } = useSWR<HistoryItem[]>(
    `/api/v1/report/budget/history?context=${context}&groupId=${groupId ?? ''}`,
    fetcher,
    { refreshInterval: 30000 },
  )
  const update = useFinanceUpdates()
  useEffect(() => {
    if (update) mutate()
  }, [update, mutate])
  useEffect(() => {
    const handleContextChange = () => {
      setCtx(getClientContext())
    }
    window.addEventListener('context-changed', handleContextChange)
    return () => {
      window.removeEventListener('context-changed', handleContextChange)
    }
  }, [])
  const initialRender = useRef(true)
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false
      return
    }
    mutate()
  }, [context, groupId, mutate])
  const history = data ?? []

  const [selected, setSelected] = useState<HistoryItem | null>(null)
  const { data: actions } = useSWR<Action[]>(
    selected ? `/api/v1/report/budget/history/${selected.id}` : null,
    fetcher,
  )

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Past Analyses</h1>
      {!selected && (
        <ul className="space-y-2">
          {history.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setSelected(item)}
                className="w-full text-left border p-2 rounded"
              >
                <p className="font-medium">{item.date}</p>
                <p className="text-sm text-gray-500">Total Cost: ${item.totalCost}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <div>
          <h2 className="text-lg font-bold mb-2">{selected.date}</h2>
          <p className="text-sm text-gray-500 mb-4">Total Cost: ${selected.totalCost}</p>
          <div className="space-y-2 mb-4">
            {(actions ?? []).map((action) => (
              <div key={action.id} className="border p-2 rounded">
                {action.description}
              </div>
            ))}
          </div>
          <button
            onClick={() => setSelected(null)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}
