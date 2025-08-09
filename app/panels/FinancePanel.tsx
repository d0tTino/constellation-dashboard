'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'
import { BudgetOption, rankBudgetOptions } from '../../lib/finance'
import { useFinanceUpdates, useSocket } from '../socket-context'

export default function FinancePanel() {
  const [budget, setBudget] = useState(1000)
  const [payoffTime, setPayoffTime] = useState(12)
  const { data, mutate } = useSWR<BudgetOption[]>(
    `/api/v1/report/budget?budget=${budget}&payoffTime=${payoffTime}`,
    fetcher,
    { refreshInterval: 30000 },
  )

  const update = useFinanceUpdates()
  const socket = useSocket()
  const [paymentSchedules, setPaymentSchedules] = useState<Record<string, any[]>>({})
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!update) return
    mutate()
    const category = update.category ?? update.data?.category ?? 'default'
    if (update.type === 'finance.decision.result') {
      const schedule =
        update.paymentSchedule ??
        update.data?.paymentSchedule ??
        update.schedule ??
        []
      setPaymentSchedules((prev) => ({ ...prev, [category]: schedule }))
    } else if (update.type === 'finance.explain.result') {
      const explanation =
        update.explanation ??
        update.data?.explanation ??
        update.message ??
        ''
      setAiExplanations((prev) => ({ ...prev, [category]: explanation }))
    }
  }, [update, mutate])

  const ranked = rankBudgetOptions(
    (data ?? [
      { category: 'Rent', amount: 1000 },
      { category: 'Food', amount: 300 },
      { category: 'Utilities', amount: 150 },
    ]).map((item) => ({ ...item, costOfDeviation: Math.abs(item.amount - budget) }))
  )

  const [selected, setSelected] = useState<typeof ranked[0] | null>(null)
  const minCost = ranked.length
    ? Math.min(...ranked.map((o) => o.costOfDeviation))
    : Infinity

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Finance</h1>
      <p className="mb-4 text-sm text-gray-500">OAuth connection to finance-engine coming soon.</p>
      <div className="mb-4 flex gap-2">
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="border p-2"
          placeholder="Budget"
        />
        <input
          type="number"
          value={payoffTime}
          onChange={(e) => setPayoffTime(Number(e.target.value))}
          className="border p-2"
          placeholder="Payoff Time"
        />
        <button
          onClick={() => mutate()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Analyze
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {ranked.map((option, idx) => {
          const label = String.fromCharCode(65 + idx)
          const isBest = option.costOfDeviation === minCost
          return (
            <div
              key={option.category}
              className={`border p-4 rounded shadow ${
                isBest ? 'border-green-500 bg-green-50' : ''
              }`}
            >
              <div className="font-bold mb-2">
                Option {label} - {option.category}
              </div>
              <p>Amount: ${option.amount}</p>
              <p>Cost of deviation: ${option.costOfDeviation}</p>
              <button
                className="mt-2 text-blue-500 underline"
                onClick={() => {
                  setSelected(option)
                  socket?.send(
                    JSON.stringify({
                      type: 'finance.decision.request',
                      category: option.category,
                    }),
                  )
                  socket?.send(
                    JSON.stringify({
                      type: 'finance.explain.request',
                      category: option.category,
                    }),
                  )
                }}
              >
                View Details
              </button>
            </div>
          )
        })}
      </div>
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">{selected.category} Details</h2>
            {paymentSchedules[selected.category] ? (
              <ul className="mb-2 list-disc pl-5">
                {paymentSchedules[selected.category].map((item, i) => (
                  <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                ))}
              </ul>
            ) : (
              <p className="mb-2">Payment schedule coming soon.</p>
            )}
            {aiExplanations[selected.category] ? (
              <p className="mb-4 whitespace-pre-wrap">
                {aiExplanations[selected.category]}
              </p>
            ) : (
              <p className="mb-4">AI explanation coming soon.</p>
            )}
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
