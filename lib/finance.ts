export type BudgetOption = {
  category: string
  amount: number
  costOfDeviation: number
}

export type RankedBudgetOption = BudgetOption & { rank: number }

export function rankBudgetOptions(options: BudgetOption[]): RankedBudgetOption[] {
  return options
    .slice()
    .sort((a, b) => a.costOfDeviation - b.costOfDeviation)
    .map((option, idx) => ({ ...option, rank: idx + 1 }))
}
