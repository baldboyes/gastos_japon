<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 mb-2">Historial</h1>
        <p class="text-sm text-slate-600">
          {{ totalExpenses }} {{ totalExpenses === 1 ? 'gasto' : 'gastos' }} •
          Total: {{ formatYen(totalAmount) }}
        </p>
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
      <Dialog v-model:open="showExpenseDetail">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Gasto</DialogTitle>
          </DialogHeader>
          <div v-if="selectedExpense" class="space-y-4">
            <!-- Place Name -->
            <div>
              <div class="text-sm font-medium text-slate-600 mb-1">Lugar</div>
              <div class="text-lg font-semibold">{{ selectedExpense.placeName }}</div>
            </div>

            <!-- Amount -->
            <div>
              <div class="text-sm font-medium text-slate-600 mb-1">Cantidad</div>
              <div class="text-2xl font-bold text-teal-600">{{ formatYen(selectedExpense.amount) }}</div>
            </div>

            <!-- Date & Time -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm font-medium text-slate-600 mb-1">Fecha</div>
                <div>{{ formatDate(selectedExpense.timestamp) }}</div>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-600 mb-1">Hora</div>
                <div>{{ formatTime(selectedExpense.timestamp) }}</div>
              </div>
            </div>

            <!-- Category & Payment -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm font-medium text-slate-600 mb-1">Categoría</div>
                <Badge :class="categoryInfo.color">
                  {{ categoryInfo.icon }} {{ categoryInfo.label }}
                </Badge>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-600 mb-1">Pago</div>
                <Badge variant="outline">
                  {{ selectedExpense.paymentMethod === 'cash' ? '💴 Efectivo' : '💳 Tarjeta' }}
                </Badge>
              </div>
            </div>

            <!-- Location -->
            <div>
              <div class="text-sm font-medium text-slate-600 mb-1">Ubicación</div>
              <div class="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div>
                  <div>{{ selectedExpense.location.city }}</div>
                  <div class="text-sm text-slate-600">{{ selectedExpense.location.prefecture }}</div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="selectedExpense.notes">
              <div class="text-sm font-medium text-slate-600 mb-1">Notas</div>
              <p class="text-sm text-slate-700">{{ selectedExpense.notes }}</p>
            </div>

            <!-- Shared -->
            <div v-if="selectedExpense.shared">
              <Badge variant="outline" class="border-purple-300 text-purple-700">
                👥 Gasto compartido
              </Badge>
            </div>
          </div>

          <DialogFooter class="mt-6">
            <Button
              variant="outline"
              @click="handleDeleteExpense"
              class="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Eliminar
            </Button>
            <Button @click="showExpenseDetail = false">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <Dialog v-model:open="showDeleteConfirm">
        <DialogContent class="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div v-if="selectedExpense" class="py-4">
            <div class="text-sm text-slate-700">
              <div class="font-semibold">{{ selectedExpense.placeName }}</div>
              <div class="text-2xl font-bold text-slate-900 mt-1">
                {{ formatYen(selectedExpense.amount) }}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showDeleteConfirm = false">
              Cancelar
            </Button>
            <Button
              @click="confirmDelete"
              class="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Expense, ExpenseCategory } from '~/types'
import { getCategoryInfo } from '~/types'
import { formatYen } from '~/utils/currency'
import { formatDate, formatTime } from '~/utils/dates'

const { expenses, deleteExpense } = useExpenses()

// Filters
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedPayment = ref('all')

// Dialog state
const showExpenseDetail = ref(false)
const showDeleteConfirm = ref(false)
const selectedExpense = ref<Expense | null>(null)

const categoryInfo = computed(() =>
  selectedExpense.value ? getCategoryInfo(selectedExpense.value.category) : null
)

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

function handleDeleteExpense() {
  showExpenseDetail.value = false
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (selectedExpense.value) {
    deleteExpense(selectedExpense.value.id)
    showDeleteConfirm.value = false
    selectedExpense.value = null
  }
}
</script>
