<template>
  <div class="space-y-4">
    <div v-for="(expensesForDate, date) in groupedExpenses" :key="date" class="space-y-3">
      <!-- Date Header -->
      <div class="flex items-center justify-between px-2 py-2 bg-gray-100 rounded-lg sticky top-0 z-10">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-900">
            {{ getRelativeDayLabel(date) }}
          </span>
          <span class="text-xs text-slate-600">
            {{ formatDate(date) }}
          </span>
        </div>
        <div class="text-sm font-bold text-slate-900">
          {{ formatYen(getTotalForDate(expensesForDate)) }}
        </div>
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
      <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ emptyTitle }}</h3>
      <p class="text-sm text-slate-600">{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Expense } from '~/types'
import { formatYen } from '~/utils/currency'
import { formatDate, getRelativeDayLabel, groupByDate, getDateString } from '~/utils/dates'

interface Props {
  expenses: Expense[]
  emptyTitle?: string
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  emptyTitle: 'Sin gastos',
  emptyMessage: 'No hay gastos para mostrar'
})

defineEmits<{
  'expense-click': [expense: Expense]
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

function getTotalForDate(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}
</script>
