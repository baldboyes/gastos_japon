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
      v-if="sortedExpenses.length === 0"
      class="text-center py-12 px-4"
    >
      <div class="text-6xl mb-4">💸</div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ emptyTitle }}</h3>
      <p class="text-sm text-slate-600">{{ emptyMessage }}</p>
    </div>

    <!-- Expense Cards -->
    <div v-else class="space-y-3">
      <ExpenseCard
        v-for="expense in sortedExpenses"
        :key="expense.id"
        :expense="expense"
        @click="handleExpenseClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense } from '~/types'
import { formatYen } from '~/utils/currency'

interface Props {
  expenses: Expense[]
  title?: string
  total?: number
  emptyTitle?: string
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  emptyTitle: 'Sin gastos aún',
  emptyMessage: 'Comienza agregando gastos para seguir tus finanzas'
})

const emit = defineEmits<{
  'expense-click': [expense: Expense]
}>()

// Ordenar gastos por timestamp (más reciente primero)
const sortedExpenses = computed(() => {
  return [...props.expenses].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
})

function handleExpenseClick(expense: Expense) {
  emit('expense-click', expense)
}
</script>
