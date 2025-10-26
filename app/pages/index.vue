<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto p-4 space-y-6">

      <!-- Daily Budget Card -->
      <DailyBudgetCard />

      <!-- Planned Expenses -->
      <div v-if="plannedExpensesList.length > 0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span>📋</span>
            <span>Gastos Previstos</span>
            <Badge variant="secondary" class="ml-1">{{ plannedExpensesList.length }}</Badge>
          </h2>
        </div>
        <div class="space-y-2">
          <PlannedExpenseCard
            v-for="planned in plannedExpensesList"
            :key="planned.id"
            :planned-expense="planned"
            @click="handlePlannedExpenseClick"
          />
        </div>
      </div>

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
import type { Expense, PlannedExpense } from '~/types'
import { formatDate } from '~/utils/dates'

const router = useRouter()
const { getTodayExpenses, deleteExpense, plannedExpenses, addExpense, deletePlannedExpense } = useExpenses()
const currentDate = computed(() => formatDate(new Date()))
const todayExpenses = computed(() => getTodayExpenses())
const todayTotal = computed(() =>
  todayExpenses.value.reduce((sum, exp) => sum + exp.amount, 0)
)

// Planned expenses list
const plannedExpensesList = computed(() => plannedExpenses.value)

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

// Handle planned expense click - convert to real expense
function handlePlannedExpenseClick(plannedExpense: PlannedExpense) {
  // Create a real expense from the planned expense
  const now = new Date()
  const expenseData = {
    timestamp: now.toISOString(),
    placeName: plannedExpense.placeName,
    amount: plannedExpense.amount,
    category: plannedExpense.category,
    notes: plannedExpense.notes,
    location: plannedExpense.location,
    paymentMethod: plannedExpense.paymentMethod,
    shared: plannedExpense.shared
  }

  // Add as real expense
  addExpense(expenseData)

  // Delete from planned expenses
  deletePlannedExpense(plannedExpense.id)
}
</script>
