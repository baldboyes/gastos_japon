<template>
  <NuxtLayout name="default">
    <div class="flex flex-col h-screen">
      <!-- Header -->
      <div class="flex-shrink-0 bg-white border-b px-4 py-4">
        <div class="max-w-screen-sm mx-auto">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h1 class="text-xl font-bold text-gray-900">Mapa de Gastos</h1>
              <p class="text-xs text-gray-600">{{ validExpensesCount }} {{ validExpensesCount === 1 ? 'ubicación' : 'ubicaciones' }}</p>
            </div>
            <Button
              v-if="validExpensesCount > 0"
              @click="showList = !showList"
              variant="outline"
              size="sm"
              class="text-xs"
            >
              <svg v-if="!showList" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/>
                <line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ showList ? 'Ver Mapa' : 'Ver Lista' }}
            </Button>
          </div>

          <!-- Filter tabs -->
          <div v-if="validExpensesCount > 0" class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              @click="selectedCategory = 'all'"
              :class="selectedCategory === 'all' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-gray-700'"
              class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            >
              Todas ({{ validExpenses.length }})
            </button>
            <button
              v-for="category in categoriesWithExpenses"
              :key="category.key"
              @click="selectedCategory = category.key"
              :class="selectedCategory === category.key ? 'bg-teal-500 text-white' : 'bg-slate-100 text-gray-700'"
              class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            >
              {{ category.icon }} {{ category.label }} ({{ category.count }})
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="validExpensesCount === 0" class="flex-1 flex items-center justify-center px-4">
        <div class="text-center">
          <div class="text-6xl mb-4">🗺️</div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Sin Ubicaciones</h2>
          <p class="text-gray-600 mb-6 max-w-sm">
            Los gastos con ubicación aparecerán aquí en el mapa
          </p>
          <Button @click="navigateTo('/add')" class="bg-gradient-to-br from-teal-500 to-teal-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            Agregar Gasto
          </Button>
        </div>
      </div>

      <!-- Map or List View -->
      <div v-else class="flex-1 relative">
        <!-- Map View -->
        <div v-show="!showList" class="w-full h-full">
          <MapView
            :expenses="filteredExpenses"
            :selected-expense-id="selectedExpenseId"
            @marker-click="handleMarkerClick"
          />
        </div>

        <!-- List View -->
        <div v-show="showList" class="w-full h-full overflow-y-auto bg-slate-50">
          <div class="max-w-screen-sm mx-auto p-4 space-y-3">
            <ExpenseCard
              v-for="expense in filteredExpenses"
              :key="expense.id"
              :expense="expense"
              @click="handleExpenseClick(expense)"
            />
          </div>
        </div>
      </div>

      <!-- Expense Detail Dialog -->
      <ExpenseDetailDialog
        v-model="showExpenseDetail"
        :expense="selectedExpense"
        show-coordinates
        @edit="handleEdit"
        @delete="handleDelete"
      >
        <template #custom-action>
          <Button @click="viewOnMap" variant="outline" size="sm" class="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Ver en Mapa
          </Button>
        </template>
      </ExpenseDetailDialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Expense, ExpenseCategory } from '~/types'
import { CATEGORIES } from '~/types'

const router = useRouter()
const { expenses, deleteExpense } = useExpenses()

// State
const showList = ref(false)
const selectedCategory = ref<ExpenseCategory | 'all'>('all')
const showExpenseDetail = ref(false)
const selectedExpense = ref<Expense | null>(null)
const selectedExpenseId = ref<string | null>(null)

// Filter expenses with valid coordinates
const validExpenses = computed(() => {
  return expenses.value.filter(e =>
    e.location.coordinates.lat !== 0 && e.location.coordinates.lng !== 0
  )
})

const validExpensesCount = computed(() => validExpenses.value.length)

// Filtered expenses by category
const filteredExpenses = computed(() => {
  if (selectedCategory.value === 'all') {
    return validExpenses.value
  }
  return validExpenses.value.filter(e => e.category === selectedCategory.value)
})

// Categories with expense counts
interface CategoryWithCount {
  key: ExpenseCategory
  icon: string
  label: string
  count: number
}

const categoriesWithExpenses = computed<CategoryWithCount[]>(() => {
  return CATEGORIES
    .map(cat => ({
      key: cat.key,
      icon: cat.icon,
      label: cat.label,
      count: validExpenses.value.filter(e => e.category === cat.key).length
    }))
    .filter(cat => cat.count > 0)
})

// Handlers
function handleMarkerClick(expense: Expense) {
  selectedExpense.value = expense
  selectedExpenseId.value = expense.id
  showExpenseDetail.value = true
}

function handleExpenseClick(expense: Expense) {
  selectedExpense.value = expense
  selectedExpenseId.value = expense.id
  showExpenseDetail.value = true
}

function viewOnMap() {
  showList.value = false
  showExpenseDetail.value = false
  // Keep selectedExpenseId to highlight on map
}

function handleEdit(expense: Expense) {
  showExpenseDetail.value = false
  router.push(`/add?id=${expense.id}`)
}

function handleDelete(expense: Expense) {
  deleteExpense(expense.id)
  selectedExpense.value = null
  selectedExpenseId.value = null
}

// Reset selection when dialog closes
watch(showExpenseDetail, (isOpen) => {
  if (!isOpen) {
    setTimeout(() => {
      selectedExpenseId.value = null
    }, 500)
  }
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
