<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- Header -->
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 mb-2">Historial</h1>
      </div>

      <div class="mb-6 flex items-center justify-between">
        <div class="text-xl text-slate-600">
          {{ totalExpenses }} {{ totalExpenses === 1 ? 'gasto' : 'gastos' }}
        </div>
        <div class="text-2xl font-bold text-slate-900 mb-2">{{ formatYen(totalAmount) }}</div>
      </div>

      <!-- Filters -->
      <div class="mb-6">
        <ExpenseFilters
          @search-change="handleSearchChange"
          @category-change="handleCategoryChange"
          @payment-change="handlePaymentChange"
        />
      </div>

      <!-- Results Summary -->
      <div v-if="hasFilters && filteredExpenses.length > 0" class="mb-4">
        <div class="text-sm text-slate-600 bg-teal-50 px-4 py-2 rounded-lg">
          Mostrando {{ filteredExpenses.length }} {{ filteredExpenses.length === 1 ? 'resultado' : 'resultados' }}
          • Total: {{ formatYen(filteredTotal) }}
        </div>
      </div>

      <!-- Expenses List -->
      <ExpensesByDate
        :expenses="filteredExpenses"
        empty-title="Sin gastos"
        empty-message="No se encontraron gastos con los filtros aplicados"
        @expense-click="handleExpenseClick"
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
import type { Expense } from '~/types'

const router = useRouter()
const { expenses, deleteExpense } = useExpenses()

// Filters
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedPayment = ref('all')

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

  return result
})

const hasFilters = computed(() =>
  searchQuery.value !== '' || selectedCategory.value !== 'all' || selectedPayment.value !== 'all'
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
