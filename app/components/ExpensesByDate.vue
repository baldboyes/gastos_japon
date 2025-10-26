<template>
  <div class="space-y-4">
    <div v-for="(expensesForDate, date) in groupedExpenses" :key="date" class="space-y-3">
      <!-- Date Header -->
      <div class="flex items-center justify-between px-2 py-2 bg-gray-100 rounded-lg sticky top-0 z-10">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-gray-900">
            {{ getRelativeDayLabel(date) }}
          </span>
          <span class="text-xs text-gray-600">
            {{ formatDate(date) }}
          </span>
        </div>
        <div class="text-sm font-bold text-gray-900">
          {{ formatAmount(getTotalForDate(expensesForDate)) }}
        </div>
      </div>

      <!-- Planned expenses for this date -->
      <div v-if="plannedExpensesForDate[date]" class="space-y-3">
        <PlannedExpenseCard
          v-for="planned in plannedExpensesForDate[date]"
          :key="planned.id"
          :planned-expense="planned"
          @click="$emit('planned-expense-click', planned)"
        />
      </div>

      <!-- Expenses for this date -->
      <div class="space-y-3">
        <ExpenseCard
          v-for="expense in expensesForDate"
          :key="expense.id"
          :expense="expense"
          @click="$emit('expense-click', expense)"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="Object.keys(groupedExpenses).length === 0" class="text-center py-12">
      <div class="text-6xl mb-4">📝</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ emptyTitle }}</h3>
      <p class="text-sm text-gray-600">{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Expense, PlannedExpense } from '~/types'
import { formatDate, getRelativeDayLabel, groupByDate, getDateString } from '~/utils/dates'

const { formatAmount } = useCurrency()

interface Props {
  expenses: Expense[]
  plannedExpenses?: PlannedExpense[]
  emptyTitle?: string
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  plannedExpenses: () => [],
  emptyTitle: 'Sin gastos',
  emptyMessage: 'No hay gastos para mostrar'
})

defineEmits<{
  'expense-click': [expense: Expense]
  'planned-expense-click': [plannedExpense: PlannedExpense]
}>()

const groupedExpenses = computed(() => {
  // Group and sort by date (newest first)
  const grouped = groupByDate(props.expenses)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const result: Record<string, Expense[]> = {}
  sortedDates.forEach(date => {
    result[date] = grouped[date].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  })

  return result
})

const plannedExpensesForDate = computed(() => {
  // Group planned expenses by their plannedDate
  const grouped: Record<string, PlannedExpense[]> = {}

  props.plannedExpenses.forEach(planned => {
    const dateKey = planned.plannedDate
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(planned)
  })

  return grouped
})

function getTotalForDate(expenses: Expense[]): number {
  // Only count real expenses, not planned expenses
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}
</script>
