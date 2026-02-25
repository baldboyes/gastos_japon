<template>
    <div class="max-w-screen-sm mx-auto px-4 py-6 space-y-6">
      
      <!-- Daily Budget Card -->
      <DashboardTripDailyBudget 
        :daily-limit="budget.dailyLimit"
        :currency="budget.currency || undefined"
        :expenses="todayExpensesMapped"
      />

      <!-- Planned Expenses -->
      <div v-if="todaysPlannedExpenses.length > 0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span>📋</span>
            <span>Gastos Previstos Hoy</span>
            <Badge variant="secondary" class="ml-1">{{ todaysPlannedExpenses.length }}</Badge>
          </h2>
        </div>
        <div class="space-y-2">
          <ExpensesPlannedCard
            v-for="planned in todaysPlannedExpenses"
            :key="planned.id"
            :planned-expense="planned"
            :currency="budget.currency || undefined"
            @click="handlePlannedExpenseClick"
          />
        </div>
      </div>

      <!-- Today's Expenses -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900">{{ currentDate }}</h3>
          <div class="text-sm font-medium text-gray-600">
            Total: {{ formatAmount(todayTotal) }}
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="todayExpensesMapped.length === 0"
          class="text-center py-12 px-4"
        >
          <div class="text-6xl mb-4">💸</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Sin gastos hoy</h3>
          <p class="text-sm text-gray-600 mb-6">Toca el botón + para agregar tu primer gasto del día</p>
        </div>

        <!-- Expense Cards -->
        <div v-else class="space-y-3">
          <ExpensesCard
            v-for="expense in todayExpensesMapped"
            :key="expense.id"
            :expense="expense"
            :currency="budget.currency || undefined"
            @click="handleExpenseClick"
          />
        </div>
      </div>

      <!-- Floating Action Button -->
      <div class="fixed bottom-6 right-6 z-50 md:hidden">
        <Button
          class="h-14 w-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700 p-0"
          @click="handleAdd"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Button>
      </div>
      
      <!-- Desktop Add Button -->
      <div class="hidden md:flex justify-center mt-8">
        <Button @click="handleAdd" class="bg-teal-600 h-12 px-8 text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
          Agregar Gasto
        </Button>
      </div>

      <!-- Expense Drawer (Add/Edit) -->
      <ExpenseDrawer
        v-model:open="showExpenseDrawer"
        :trip-id="tripId"
        :expense-to-edit="expenseToEdit"
        :trip-moneda="budget.currency"
        @success="handleDrawerSuccess"
      />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate, getDateString } from '~/utils/dates'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import ExpenseDrawer from '~/components/expenses/ExpenseDrawer.vue'
import DashboardTripDailyBudget from '~/components/dashboard/TripDailyBudget.vue'
import ExpensesPlannedCard from '~/components/expenses/PlannedCard.vue'
import ExpensesCard from '~/components/expenses/Card.vue'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { useTrips } from '~/composables/useTrips'
import { CURRENCIES } from '~/composables/useSettings'
import { getCategoryFromDirectus, getPaymentMethodFromDirectus } from '~/utils/directus-mappings'
import type { Expense, PlannedExpense, TripExpense, Budget } from '~/types'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const tripId = computed(() => route.params.id as string)

const { expenses: rawExpenses, fetchExpenses, updateExpense } = useTripExpenses()
const { currentTrip } = useTrips()

// Load data
onMounted(() => {
  if (tripId.value) {
    fetchExpenses(tripId.value)
  }
})

// Budget from Trip
const budget = computed<Budget>(() => ({
  dailyLimit: currentTrip.value?.presupuesto_diario || 0,
  startDate: currentTrip.value?.fecha_inicio || new Date().toISOString(),
  currency: currentTrip.value?.moneda || null
}))

// Currency formatting helper
const currencySymbol = computed(() => {
  if (!budget.value.currency) return '$'
  const currencyInfo = CURRENCIES.find(c => c.code === budget.value.currency)
  return currencyInfo?.symbol || '$'
})

const formatAmount = (amount: number) => {
  return `${currencySymbol.value}${amount.toLocaleString()}`
}

const currentDate = computed(() => formatDate(new Date()))

// Mappers
const mapToExpense = (e: TripExpense): Expense => ({
  id: e.id.toString(),
  timestamp: e.fecha,
  placeName: e.concepto,
  amount: e.monto,
  category: getCategoryFromDirectus(e.categoria),
  notes: e.notes || '',
  location: {
    coordinates: {
      lat: e.ubicacion_lat || 0,
      lng: e.ubicacion_lng || 0
    },
    city: e.ciudad || '',
    prefecture: e.prefectura || ''
  },
  paymentMethod: getPaymentMethodFromDirectus(e.metodo_pago),
  shared: e.es_compartido
})

const mapToPlannedExpense = (e: TripExpense): PlannedExpense => ({
  id: e.id.toString(),
  plannedDate: e.fecha.split(' ')[0] || e.fecha,
  placeName: e.concepto,
  amount: e.monto,
  category: getCategoryFromDirectus(e.categoria),
  notes: e.notes || '',
  location: {
    coordinates: {
      lat: e.ubicacion_lat || 0,
      lng: e.ubicacion_lng || 0
    },
    city: e.ciudad || '',
    prefecture: e.prefectura || ''
  },
  paymentMethod: getPaymentMethodFromDirectus(e.metodo_pago),
  shared: e.es_compartido
})

// Filter for today
const todayString = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const todayExpensesMapped = computed(() => {
  return rawExpenses.value
    .filter(e => e.estado !== 'previsto' && e.fecha.startsWith(todayString.value))
    .map(mapToExpense)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const todaysPlannedExpenses = computed(() => {
  return rawExpenses.value
    .filter(e => e.estado === 'previsto' && e.fecha.startsWith(todayString.value))
    .map(mapToPlannedExpense)
})

const todayTotal = computed(() =>
  todayExpensesMapped.value.reduce((sum, exp) => sum + exp.amount, 0)
)

// Drawer state
const showExpenseDrawer = ref(false)
const expenseToEdit = ref<TripExpense | null>(null)

function handleAdd() {
  expenseToEdit.value = null
  showExpenseDrawer.value = true
}

function handleExpenseClick(expense: Expense) {
  const original = rawExpenses.value.find(e => e.id.toString() === expense.id)
  if (original) {
    expenseToEdit.value = original
    showExpenseDrawer.value = true
  }
}

function handleDrawerSuccess() {
  fetchExpenses(tripId.value)
}

// Handle planned expense click - convert to real expense
async function handlePlannedExpenseClick(plannedExpense: PlannedExpense) {
  const original = rawExpenses.value.find(e => e.id.toString() === plannedExpense.id)
  if (original) {
    const now = new Date()
    // Format YYYY-MM-DD HH:MM
    const dateStr = todayString.value
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    const timestamp = `${dateStr} ${timeStr}`

    await updateExpense(original.id, {
      estado: 'real',
      fecha: timestamp
    })
    
    fetchExpenses(tripId.value)
  }
}
</script>
