'use client'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'

type HistoryItem = {
  id: string
  date: string
  totalCost: number
}

export default function FinanceHistoryPage() {
  const { data } = useSWR<HistoryItem[]>('/api/v1/report/budget/history', fetcher)
  const history = data ?? []

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Past Analyses</h1>
      <ul className="space-y-2">
        {history.map((item) => (
          <li key={item.id} className="border p-2 rounded">
            <p className="font-medium">{item.date}</p>
            <p className="text-sm text-gray-500">Total Cost: ${item.totalCost}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
