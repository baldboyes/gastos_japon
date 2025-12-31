<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Historial</h1>
      </div>

      <div class="mb-6 flex items-center justify-between">
        <div class="text-xl text-gray-600">
          {{ totalExpenses }} {{ totalExpenses === 1 ? 'gasto' : 'gastos' }}
        </div>
        <div class="text-2xl font-bold text-gray-900 mb-2">{{ formatAmount(totalAmount) }}</div>
      </div>

      <!-- Filters -->
      <div class="mb-6">
        <ExpenseFilters
          @search-change="handleSearchChange"
          @category-change="handleCategoryChange"
          @payment-change="handlePaymentChange"
          @shared-change="handleSharedChange"
          @date-change="handleDateChange"
        />
      </div>

      <!-- Results Summary -->
      <div v-if="hasFilters && filteredExpenses.length > 0" class="mb-4">
        <div class="text-sm text-gray-600 bg-teal-50 px-4 py-2 rounded-lg">
          Mostrando {{ filteredExpenses.length }} {{ filteredExpenses.length === 1 ? 'resultado' : 'resultados' }}
          • Total: {{ formatAmount(filteredTotal) }}
        </div>
      </div>

      <!-- Expenses List -->
      <ExpensesByDate
        :expenses="filteredExpenses"
        :planned-expenses="filteredPlannedExpenses"
        empty-title="Sin gastos"
        empty-message="No se encontraron gastos con los filtros aplicados"
        @expense-click="handleExpenseClick"
        @planned-expense-click="handlePlannedExpenseClick"
      />

      <!-- Expense Detail Dialog -->
      <ExpenseDetailDialog
        v-model="showExpenseDetail"
        :expense="selectedExpense"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Expense, PlannedExpense } from '~/types'

interface DateFilterRange {
  start: Date | null
  end: Date | null
}

const { formatAmount } = useCurrency()
const router = useRouter()
const { expenses, plannedExpenses, deleteExpense, addExpense, deletePlannedExpense } = useExpenses()

// Filters
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedPayment = ref('all')
const showSharedOnly = ref(false)
const dateRange = ref<DateFilterRange>({ start: null, end: null })

// Dialog state
const showExpenseDetail = ref(false)
const selectedExpense = ref<Expense | null>(null)

// Filtered expenses
const filteredExpenses = computed(() => {
  let result = [...expenses.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e => e.placeName.toLowerCase().includes(query))
  }

  // Category filter
  if (selectedCategory.value !== 'all') {
    result = result.filter(e => e.category === selectedCategory.value)
  }

  // Payment method filter
  if (selectedPayment.value !== 'all') {
    result = result.filter(e => e.paymentMethod === selectedPayment.value)
  }

  // Shared filter
  if (showSharedOnly.value) {
    result = result.filter(e => e.shared === true)
  }

  // Date filter
  if (dateRange.value.start && dateRange.value.end) {
    result = result.filter(e => {
      const expenseDate = new Date(e.timestamp)
      return expenseDate >= dateRange.value.start! && expenseDate <= dateRange.value.end!
    })
  }

  return result
})

// Filtered planned expenses (same filters as regular expenses, except date)
const filteredPlannedExpenses = computed(() => {
  let result = [...plannedExpenses.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e => e.placeName.toLowerCase().includes(query))
  }

  // Category filter
  if (selectedCategory.value !== 'all') {
    result = result.filter(e => e.category === selectedCategory.value)
  }

  // Payment method filter
  if (selectedPayment.value !== 'all') {
    result = result.filter(e => e.paymentMethod === selectedPayment.value)
  }

  // Shared filter
  if (showSharedOnly.value) {
    result = result.filter(e => e.shared === true)
  }

  // Note: Planned expenses don't have timestamps, so we don't filter by date

  return result
})

const hasFilters = computed(() =>
  searchQuery.value !== '' || selectedCategory.value !== 'all' || selectedPayment.value !== 'all' || showSharedOnly.value || dateRange.value.start !== null
)

const totalExpenses = computed(() => expenses.value.length)

const totalAmount = computed(() =>
  expenses.value.reduce((sum, e) => sum + e.amount, 0)
)

const filteredTotal = computed(() =>
  filteredExpenses.value.reduce((sum, e) => sum + e.amount, 0)
)

// Handlers
function handleSearchChange(query: string) {
  searchQuery.value = query
}

function handleCategoryChange(category: string) {
  selectedCategory.value = category
}

function handlePaymentChange(payment: string) {
  selectedPayment.value = payment
}

function handleSharedChange(showShared: boolean) {
  showSharedOnly.value = showShared
}

function handleDateChange(range: DateFilterRange) {
  dateRange.value = range
}

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
