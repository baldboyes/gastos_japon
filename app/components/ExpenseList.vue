<template>
  <div class="space-y-3">
    <!-- Header -->
    <div v-if="title" class="flex items-center justify-between px-1">
      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
      <div v-if="total !== undefined" class="text-sm font-medium text-slate-600">
        Total: {{ formatYen(total) }}
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="expenses.length === 0"
      class="text-center py-12 px-4"
    >
      <div class="text-6xl mb-4">💸</div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ emptyTitle }}</h3>
      <p class="text-sm text-slate-600">{{ emptyMessage }}</p>
    </div>

    <!-- Expense Cards -->
    <div v-else class="space-y-3">
      <ExpenseCard
        v-for="expense in expenses"
        :key="expense.id"
        :expense="expense"
        @click="handleExpenseClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Expense } from '~/types'
import { formatYen } from '~/utils/currency'

interface Props {
  expenses: Expense[]
  title?: string
  total?: number
  emptyTitle?: string
  emptyMessage?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  emptyTitle: 'Sin gastos aún',
  emptyMessage: 'Comienza agregando gastos para seguir tus finanzas'
})

const emit = defineEmits<{
  'expense-click': [expense: Expense]
}>()

function handleExpenseClick(expense: Expense) {
  emit('expense-click', expense)
}
</script>
