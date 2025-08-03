import { describe, it, expect } from 'vitest'
import { rankBudgetOptions, BudgetOption } from '../lib/finance'

describe('rankBudgetOptions', () => {
  it('ranks options by costOfDeviation ascending', () => {
    const options: BudgetOption[] = [
      { category: 'A', amount: 100, costOfDeviation: 50 },
      { category: 'B', amount: 100, costOfDeviation: 10 },
      { category: 'C', amount: 100, costOfDeviation: 30 },
    ]
    const ranked = rankBudgetOptions(options)
    expect(ranked.map((o) => o.category)).toEqual(['B', 'C', 'A'])
    expect(ranked.map((o) => o.rank)).toEqual([1, 2, 3])
  })
})
