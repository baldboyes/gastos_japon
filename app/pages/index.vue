<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto p-4 space-y-6">

      <!-- Daily Budget Card -->
      <DailyBudgetCard />

      <!-- Today's Expenses -->
      <div>
        <ExpenseList
          :expenses="todayExpenses"
          title="Gastos de Hoy"
          :total="todayTotal"
          empty-title="Sin gastos hoy"
          empty-message="Toca el botón + abajo para agregar tu primer gasto"
          @expense-click="handleExpenseClick"
        />
      </div>

      <!-- Floating Action Button -->
      <button
        class="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform z-40"
        @click="navigateToAdd"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
      </button>
    </div>

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
      </DialogContent>
    </Dialog>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Expense } from '~/types'
import { getCategoryInfo } from '~/types'
import { formatYen } from '~/utils/currency'
import { formatDate, formatTime } from '~/utils/dates'

const { getTodayExpenses } = useExpenses()

const todayExpenses = computed(() => getTodayExpenses())
const todayTotal = computed(() =>
  todayExpenses.value.reduce((sum, exp) => sum + exp.amount, 0)
)

// Expense detail dialog
const showExpenseDetail = ref(false)
const selectedExpense = ref<Expense | null>(null)

const categoryInfo = computed(() =>
  selectedExpense.value ? getCategoryInfo(selectedExpense.value.category) : null
)

function handleExpenseClick(expense: Expense) {
  selectedExpense.value = expense
  showExpenseDetail.value = true
}

function navigateToAdd() {
  navigateTo('/add')
}
</script>
