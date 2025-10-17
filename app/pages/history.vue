<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Historial</h1>
        <div class="flex gap-2">
          <!-- Export Button -->
          <button
            @click="handleExport"
            class="p-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
            title="Exportar gastos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
          </button>
          <!-- Import Button -->
          <button
            @click="triggerImport"
            class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Importar gastos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleImport"
            class="hidden"
          />
        </div>
      </div>

      <div class="mb-6 flex items-center justify-between">
        <div class="text-xl text-gray-600">
          {{ totalExpenses }} {{ totalExpenses === 1 ? 'gasto' : 'gastos' }}
        </div>
        <div class="text-2xl font-bold text-gray-900 mb-2">{{ formatYen(totalAmount) }}</div>
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
        <div class="text-sm text-gray-600 bg-teal-50 px-4 py-2 rounded-lg">
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
const { expenses, deleteExpense, exportData, importData } = useExpenses()

// Filters
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedPayment = ref('all')

// Dialog state
const showExpenseDetail = ref(false)
const selectedExpense = ref<Expense | null>(null)

// File input ref
const fileInput = ref<HTMLInputElement | null>(null)

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

// Export/Import handlers
function handleExport() {
  try {
    const jsonData = exportData()
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gastos-japon-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting data:', error)
    alert('Error al exportar los datos')
  }
}

function triggerImport() {
  fileInput.value?.click()
}

function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const success = importData(content)

      if (success) {
        alert('Datos importados correctamente')
        // Reset file input
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      } else {
        alert('Error al importar los datos. Verifica el formato del archivo.')
      }
    } catch (error) {
      console.error('Error importing data:', error)
      alert('Error al importar los datos')
    }
  }
  reader.readAsText(file)
}
</script>
