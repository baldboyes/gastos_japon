<template>
    <div class="max-w-screen-sm mx-auto px-4 py-6 space-y-6">

      <!-- Today's Accommodation -->
      <div v-if="currentAccommodation" class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
        <div class="bg-indigo-50 p-3 rounded-full text-indigo-600 shrink-0">
          <BedDouble class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <h3 class="font-bold text-gray-900 truncate pr-2">Noche en {{ currentAccommodation.nombre }}</h3>
            <a v-if="currentAccommodation.enlace_google" :href="currentAccommodation.enlace_google" target="_blank" class="text-indigo-600 hover:text-indigo-800 shrink-0">
              <ExternalLink class="w-4 h-4" />
            </a>
          </div>
          <div class="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin class="w-3 h-3 shrink-0" />
            <span class="truncate">{{ currentAccommodation.ubicacion?.city || currentAccommodation.ciudad || 'Ubicación desconocida' }}</span>
          </div>
        </div>
      </div>
      
      <!-- Daily Budget Card -->
      <DashboardTripDailyBudget 
        :daily-limit="budget.dailyLimit"
        :currency="budget.currency || undefined"
        :expenses="todayExpensesMapped"
      />

      <!-- Planned Expenses -->
      <div v-if="todaysPlannedExpenses.length > 0">
        <div class="flex items-center justify-between mb-3 w-full">
          <h2 class="text-lg font-semibold text-gray-700 flex items-center justify-between gap-2 w-full">
            <span>Gastos previstos</span>
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
            @delete="handleDeletePlanned"
          />
        </div>
      </div>

      <!-- Today's Expenses -->
      <div>
        <!--
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900">{{ currentDate }}</h3>
          <div class="text-sm font-medium text-gray-600">
            Total: {{ formatAmount(todayTotal) }}
          </div>
        </div>
        -->
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
      <div class="fixed bottom-6 right-6 z-50">
        <Button
          class="h-14 w-14 rounded-full shadow-lg bg-red-400 hover:bg-red-500 p-0"
          @click="handleAdd"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
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

      <!-- Delete Confirmation Dialog -->
      <AlertDialog v-model:open="isDeletePlannedOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto previsto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{{ plannedExpenseToDelete?.placeName }}" de los gastos previstos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction @click="confirmDeletePlanned" class="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate, getDateString } from '~/utils/dates'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { BedDouble, MapPin, ExternalLink } from 'lucide-vue-next'
import { startOfDay, parseISO } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import ExpenseDrawer from '~/components/expenses/ExpenseDrawer.vue'
import DashboardTripDailyBudget from '~/components/dashboard/TripDailyBudget.vue'
import ExpensesPlannedCard from '~/components/expenses/PlannedCard.vue'
import ExpensesCard from '~/components/expenses/Card.vue'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { CURRENCIES } from '~/composables/useSettings'
import { getCategoryFromDirectus, getPaymentMethodFromDirectus } from '~/utils/directus-mappings'
import type { Expense, PlannedExpense, TripExpense, Budget } from '~/types'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const tripId = computed(() => route.params.id as string)

const { expenses: rawExpenses, fetchExpenses, updateExpense, deleteExpense } = useTripExpenses()
const { alojamientos, fetchOrganizationData } = useTripOrganization()
const { currentTrip } = useTrips()

// Load data
onMounted(() => {
  if (tripId.value) {
    fetchExpenses(tripId.value)
    fetchOrganizationData(tripId.value)
  }
})

const currentAccommodation = computed(() => {
  const today = startOfDay(new Date())
  
  return alojamientos.value.find(a => {
    if (!a.fecha_entrada || !a.fecha_salida) return false
    const start = startOfDay(parseISO(a.fecha_entrada))
    const end = startOfDay(parseISO(a.fecha_salida))
    
    return today >= start && today < end
  })
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

// Delete Planned Expense Logic
const isDeletePlannedOpen = ref(false)
const plannedExpenseToDelete = ref<PlannedExpense | null>(null)

function handleDeletePlanned(planned: PlannedExpense) {
  plannedExpenseToDelete.value = planned
  isDeletePlannedOpen.value = true
}

async function confirmDeletePlanned() {
  if (plannedExpenseToDelete.value) {
    await deleteExpense(plannedExpenseToDelete.value.id)
    fetchExpenses(tripId.value)
    isDeletePlannedOpen.value = false
    plannedExpenseToDelete.value = null
  }
}
</script>
