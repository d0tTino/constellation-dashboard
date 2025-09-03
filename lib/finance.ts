export type BudgetOption = {
  category: string
  amount: number
  costOfDeviation: number
}

export type RankedBudgetOption = BudgetOption & { rank: number }

export interface PaymentScheduleItem {
  description: string
  amount?: number
  dueDate?: string
}

export interface FinanceUpdate {
  type: 'finance.decision.result' | 'finance.explain.result'
  category?: string
  paymentSchedule?: PaymentScheduleItem[]
  schedule?: PaymentScheduleItem[]
  explanation?: string
  message?: string
  data?: {
    category?: string
    paymentSchedule?: PaymentScheduleItem[]
    explanation?: string
  }
}

export function rankBudgetOptions(options: BudgetOption[]): RankedBudgetOption[] {
  const sorted = options
    .slice()
    .sort((a, b) => a.costOfDeviation - b.costOfDeviation)

  const baseCost = sorted.length ? sorted[0].costOfDeviation : 0

  return sorted.map((option, idx) => ({
    ...option,
    costOfDeviation: option.costOfDeviation - baseCost,
    rank: idx + 1,
  }))
}
