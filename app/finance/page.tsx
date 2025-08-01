'use client'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'

type BudgetItem = {
  category: string
  amount: number
}

export default function FinancePage() {
  const { data } = useSWR<BudgetItem[]>('/api/v1/report/budget', fetcher)

  const budget = data ?? [
    { category: 'Rent', amount: 1000 },
    { category: 'Food', amount: 300 },
    { category: 'Utilities', amount: 150 },
  ]

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Finance</h1>
      <p className="mb-4 text-sm text-gray-500">OAuth connection to finance-engine coming soon.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budget.map((item, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">${item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
