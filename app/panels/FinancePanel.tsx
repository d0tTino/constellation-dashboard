'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'
import { BudgetOption, rankBudgetOptions } from '../../lib/finance'

export default function FinancePanel() {
  const [budget, setBudget] = useState(1000)
  const [payoffTime, setPayoffTime] = useState(12)
  const { data, mutate } = useSWR<BudgetOption[]>(
    `/api/v1/report/budget?budget=${budget}&payoffTime=${payoffTime}`,
    fetcher,
    { refreshInterval: 30000 },
  )

  const ranked = rankBudgetOptions(
    (data ?? [
      { category: 'Rent', amount: 1000 },
      { category: 'Food', amount: 300 },
      { category: 'Utilities', amount: 150 },
    ]).map((item) => ({ ...item, costOfDeviation: Math.abs(item.amount - budget) }))
  )

  const [selected, setSelected] = useState<typeof ranked[0] | null>(null)

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
        {ranked.map((option) => (
          <div key={option.category} className="border p-4 rounded shadow">
            <div className="font-bold mb-2">
              #{option.rank} {option.category}
            </div>
            <p>Amount: ${option.amount}</p>
            <p>Cost of deviation: ${option.costOfDeviation}</p>
            <button
              className="mt-2 text-blue-500 underline"
              onClick={() => setSelected(option)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">{selected.category} Details</h2>
            <p className="mb-2">Payment schedule coming soon.</p>
            <p className="mb-4">AI explanation coming soon.</p>
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
