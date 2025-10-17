<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto p-4 space-y-6">

      <!-- Daily Budget Card -->
      <DailyBudgetCard />

      <!-- Today's Expenses -->
      <div>
        <ExpenseList
          :expenses="todayExpenses"
          :title="currentDate"
          :total="todayTotal"
          empty-title="Sin gastos hoy"
          empty-message="Toca el botón + abajo para agregar tu primer gasto"
          @expense-click="handleExpenseClick"
        />
      </div>
    </div>

    <!-- Expense Detail Dialog -->
    <ExpenseDetailDialog
      v-model="showExpenseDetail"
      :expense="selectedExpense"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Expense } from '~/types'
import { formatDate } from '~/utils/dates'

const router = useRouter()
const { getTodayExpenses, deleteExpense } = useExpenses()
const currentDate = computed(() => formatDate(new Date()))
const todayExpenses = computed(() => getTodayExpenses())
const todayTotal = computed(() =>
  todayExpenses.value.reduce((sum, exp) => sum + exp.amount, 0)
)

// Expense detail dialog
const showExpenseDetail = ref(false)
const selectedExpense = ref<Expense | null>(null)

function handleExpenseClick(expense: Expense) {
  selectedExpense.value = expense
  showExpenseDetail.value = true
}

function handleEdit(expense: Expense) {
  showExpenseDetail.value = false
  router.push(`/add?id=${expense.id}`)
}

function handleDelete(expense: Expense) {
  deleteExpense(expense.id)
  selectedExpense.value = null
}
</script>
