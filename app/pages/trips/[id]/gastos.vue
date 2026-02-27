<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Wallet, TrendingUp, ArrowRightLeft, Plus, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { useTrips } from '~/composables/useTrips'
import { useWallet } from '~/composables/useWallet'
import type { Expense, PlannedExpense, ExpenseCategory, PaymentMethod, TripExpense, Budget } from '~/types'
import { getCategoryInfo } from '~/types'
import type { DateFilterRange } from '~/components/common/DateRangeFilter.vue'
import { formatDate, getDateString } from '~/utils/dates'
import { groupByDate } from '~/utils/grouping'
import ExpenseDrawer from '~/components/expenses/ExpenseDrawer.vue'
import ExpensesFilters from '~/components/expenses/Filters.vue'
import ExpensesGroupedList from '~/components/expenses/GroupedList.vue'
import ExpensesDetailDialog from '~/components/expenses/DetailDialog.vue'
import MapsView from '~/components/maps/View.vue'
import DashboardStatsCard from '~/components/dashboard/StatsCard.vue'
import ChartsDailySpending from '~/components/charts/DailySpending.vue'
import ChartsCategoryBreakdown from '~/components/charts/CategoryBreakdown.vue'
import ChartsPaymentMethod from '~/components/charts/PaymentMethod.vue'
import { DIRECTUS_TO_CATEGORY, DIRECTUS_TO_PAYMENT, getCategoryFromDirectus, getPaymentMethodFromDirectus } from '~/utils/directus-mappings'
import { CURRENCIES } from '~/composables/useSettings'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Toaster } from '~/components/ui/sonner'

definePageMeta({
  layout: 'dashboard'
})

const router = useRouter()
const route = useRoute()
const tripId = computed(() => route.params.id as string)
const { t } = useI18n()

const { expenses: rawExpenses, fetchExpenses, deleteExpense, updateExpense } = useTripExpenses()
const { currentTrip } = useTrips()
const { 
  cambios, fetchCambios,
  createCambio, deleteCambio, 
  totalInvestedEUR, totalJPYAcquired, currentJPYBalance,
  paymentBreakdown 
} = useWallet()

// Load data
onMounted(() => {
  if (tripId.value) {
    fetchExpenses(tripId.value)
    fetchCambios(tripId.value)
  }
})

// Budget from Trip
const budget = computed<Budget>(() => ({
  dailyLimit: currentTrip.value?.presupuesto_diario || 0,
  startDate: currentTrip.value?.fecha_inicio || new Date().toISOString(),
  currency: currentTrip.value?.moneda || null
}))

// Override currency symbol for this page using trip currency
const currencySymbol = computed(() => {
  if (!budget.value.currency) return '$'
  // Find symbol in CURRENCIES list if available, or just use the code
  const currencyInfo = CURRENCIES.find(c => c.code === budget.value.currency)
  return currencyInfo?.symbol || '$'
})

// Custom format amount function that uses the trip's currency
const formatAmount = (amount: number) => {
  return `${currencySymbol.value}${amount.toLocaleString()}`
}

// Calculate remaining daily budget
const remainingDailyBudget = computed(() => {
  const limit = budget.value.dailyLimit
  if (!limit) return 0
  
  // Get today in local format YYYY-MM-DD
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const today = `${year}-${month}-${day}`
  
  const todayExpenses = expenses.value.filter(e => {
    // Check if timestamp string contains today's date
    // Handles ISO (YYYY-MM-DDTHH:mm:ss) and Directus (YYYY-MM-DD HH:mm:ss) formats
    return e.timestamp.startsWith(today)
  })
  
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
  return limit - todaySpent
})

// View mode
const viewMode = ref<string>('list')

// Filters
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedPayment = ref('all')
const showSharedOnly = ref(false)
const dateRange = ref<DateFilterRange>({ start: null, end: null })

// Dialog state
const showExpenseDetail = ref(false)
const selectedExpense = ref<Expense | null>(null)

// Drawer state
const showExpenseDrawer = ref(false)
const expenseToEdit = ref<TripExpense | null>(null)

// ------------------------------------------------------------------
// WALLET LOGIC
// ------------------------------------------------------------------

const isWalletModalOpen = ref(false)
const walletFormData = ref<{
  fecha: string
  origen_eur: number
  destino_jpy: number
  lugar: string
  destino_fondo: 'efectivo' | 'tarjeta' | 'suica'
}>({
  fecha: new Date().toISOString().slice(0, 16),
  origen_eur: 0,
  destino_jpy: 0,
  lugar: '',
  destino_fondo: 'efectivo'
})

const handleWalletSave = async () => {
  try {
    await createCambio({
      ...walletFormData.value,
      viaje_id: parseInt(tripId.value)
    })
    isWalletModalOpen.value = false
    walletFormData.value = {
      fecha: new Date().toISOString().slice(0, 16),
      origen_eur: 0,
      destino_jpy: 0,
      lugar: '',
      destino_fondo: 'efectivo'
    }
    toast.success(String(t('trip_expenses_page.wallet.toasts.saved')))
  } catch (e) {
    toast.error(String(t('trip_expenses_page.wallet.toasts.error')))
  }
}

const formatEUR = (v: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
}
const formatJPY = (v: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(v)
}

// ------------------------------------------------------------------
// DATA MAPPING
// ------------------------------------------------------------------

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
  shared: e.es_compartido,
  photo: undefined // TODO: Add photo support if needed
})

const mapToPlannedExpense = (e: TripExpense): PlannedExpense => ({
  id: e.id.toString(),
  plannedDate: e.fecha.split(' ')[0] || e.fecha, // Assuming ISO or YYYY-MM-DD
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

const expenses = computed(() => {
  return rawExpenses.value
    .filter(e => e.estado !== 'previsto')
    .map(mapToExpense)
})

const plannedExpenses = computed(() => {
  return rawExpenses.value
    .filter(e => e.estado === 'previsto')
    .map(mapToPlannedExpense)
})

// ------------------------------------------------------------------
// HISTORY LOGIC
// ------------------------------------------------------------------

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

  return result
})

const hasFilters = computed(() =>
  searchQuery.value !== '' || selectedCategory.value !== 'all' || selectedPayment.value !== 'all' || showSharedOnly.value || dateRange.value.start !== null
)

const totalExpensesCount = computed(() => expenses.value.length)

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

function handleClearFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedPayment.value = 'all'
  showSharedOnly.value = false
  dateRange.value = { start: null, end: null }
}

function handleExpenseClick(expense: Expense) {
  selectedExpense.value = expense
  showExpenseDetail.value = true
}

function handleAdd() {
  expenseToEdit.value = null
  showExpenseDrawer.value = true
}

function handleEdit(expense: Expense) {
  showExpenseDetail.value = false
  // Find original TripExpense
  const original = rawExpenses.value.find(e => e.id.toString() === expense.id)
  if (original) {
    expenseToEdit.value = original
    showExpenseDrawer.value = true
  }
}

function handleDelete(expense: Expense) {
  // Find original TripExpense
  const original = rawExpenses.value.find(e => e.id.toString() === expense.id)
  if (original) {
    deleteExpense(original.id)
    selectedExpense.value = null
  }
}

function handleDrawerSuccess() {
  fetchExpenses(tripId.value)
}

// Handle planned expense click - convert to real expense
async function handlePlannedExpenseClick(plannedExpense: PlannedExpense) {
  const original = rawExpenses.value.find(e => e.id.toString() === plannedExpense.id)
  if (original) {
    // Update estado to 'real'
    // Also update timestamp to now?
    const now = new Date()
    // Format YYYY-MM-DD HH:MM
    const dateStr = getDateString(now)
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    const timestamp = `${dateStr} ${timeStr}`

    await updateExpense(original.id, {
      estado: 'real',
      fecha: timestamp
    })
    
    // Refresh
    fetchExpenses(tripId.value)
  }
}

// ------------------------------------------------------------------
// STATS LOGIC
// ------------------------------------------------------------------

// Overall stats
const totalSpent = computed(() => expenses.value.reduce((sum, e) => sum + e.amount, 0))

const tripDays = computed(() => {
  const dates = groupByDate(expenses.value, 'timestamp', (d) => getDateString(d))
  return dates.length
})

const averageDaily = computed(() => {
  if (tripDays.value === 0) return 0
  return Math.round(totalSpent.value / tripDays.value)
})

// Top expenses
const topExpenses = computed(() => {
  return [...expenses.value]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})
</script>

<template>
  <div class="max-w-screen-sm mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ formatAmount(totalAmount) }}</h1>
        <div class="text-sm text-gray-600">
          {{ totalExpensesCount }} {{ totalExpensesCount === 1 ? $t('trip_expenses_page.labels.expense_singular') : $t('trip_expenses_page.labels.expense_plural') }}
        </div>
      </div>
      <Button @click="handleAdd" size="icon" class="rounded-full h-12 w-12 shadow-lg bg-teal-600 hover:bg-teal-700">
        <Plus class="h-6 w-6" />
      </Button>
    </div>

    <Tabs v-model="viewMode" class="w-full">
      <TabsList class="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="list">{{ $t('trip_expenses_page.tabs.list') }}</TabsTrigger>
        <TabsTrigger value="map">{{ $t('trip_expenses_page.tabs.map') }}</TabsTrigger>
        <TabsTrigger value="stats">{{ $t('trip_expenses_page.tabs.stats') }}</TabsTrigger>
        <TabsTrigger value="wallet">{{ $t('trip_expenses_page.tabs.wallet') }}</TabsTrigger>
      </TabsList>

      <div v-if="viewMode === 'list' || viewMode === 'map'" class="mb-4">
        <ExpensesFilters
          :search-query="searchQuery"
          :category="selectedCategory"
          :payment="selectedPayment"
          :shared="showSharedOnly"
          :date-range="dateRange"
          @update:search-query="searchQuery = $event"
          @update:category="selectedCategory = $event"
          @update:payment="selectedPayment = $event"
          @update:shared="showSharedOnly = $event"
          @update:date-range="dateRange = $event"
          @search-change="handleSearchChange"
          @category-change="handleCategoryChange"
          @payment-change="handlePaymentChange"
          @shared-change="handleSharedChange"
          @date-change="handleDateChange"
        />
      </div>

      <!-- Results Summary (Only for List and Map) -->
      <div v-if="viewMode !== 'stats' && viewMode !== 'wallet' && hasFilters && filteredExpenses.length > 0" class="mb-4">
        <div class="text-sm text-gray-600 bg-teal-50 px-4 py-2 rounded-lg">
          {{ $t('trip_expenses_page.results.showing') }} {{ filteredExpenses.length }} {{ filteredExpenses.length === 1 ? $t('trip_expenses_page.results.result_singular') : $t('trip_expenses_page.results.result_plural') }}
          • {{ $t('trip_expenses_page.results.total_prefix') }} {{ formatAmount(filteredTotal) }}
        </div>
      </div>

      <!-- Expenses List -->
      <TabsContent value="list" class="space-y-6">
        <ExpensesGroupedList
          :expenses="filteredExpenses"
          :planned-expenses="filteredPlannedExpenses"
          :currency="budget.currency || undefined"
          :empty-title="$t('trip_expenses_page.empty.title')"
          :empty-message="$t('trip_expenses_page.empty.subtitle')"
          @expense-click="handleExpenseClick"
          @planned-expense-click="handlePlannedExpenseClick"
        />
      </TabsContent>

      <!-- MAP CONTENT -->
      <TabsContent value="map">
        <div class="h-[60vh] rounded-lg overflow-hidden border border-gray-200">
          <MapsView
            :expenses="filteredExpenses"
            :selected-expense-id="selectedExpense?.id"
            @marker-click="handleExpenseClick"
          />
        </div>
      </TabsContent>

      <!-- STATS CONTENT -->
      <TabsContent value="stats">
        <!-- Empty State -->
        <div v-if="expenses.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📊</div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ $t('trip_expenses_page.stats.empty.title') }}</h2>
          <p class="text-gray-600 mb-6">
            {{ $t('trip_expenses_page.stats.empty.subtitle') }}
          </p>
          <Button @click="handleAdd" class="bg-teal-600 h-14 text-lg">
            <Plus class="mr-2 h-5 w-5" />
            {{ $t('trip_expenses_page.stats.empty.cta') }}
          </Button>
        </div>

        <!-- Statistics Content -->
        <div v-else class="space-y-6">
          <!-- Overview Cards -->
          <div class="grid grid-cols-2 gap-4">
            <DashboardStatsCard
              :label="$t('trip_expenses_page.stats.overview.total')"
              :value="formatAmount(totalSpent)"
              :subtitle="`${expenses.length} ${expenses.length === 1 ? $t('trip_expenses_page.labels.expense_singular') : $t('trip_expenses_page.labels.expense_plural')}`"
              icon="💰"
              icon-bg-class="bg-teal-100"
            />
            <DashboardStatsCard
              :label="$t('trip_expenses_page.stats.overview.daily_average')"
              :value="formatAmount(averageDaily)"
              :subtitle="`${tripDays} ${tripDays === 1 ? $t('trip_expenses_page.labels.day_singular') : $t('trip_expenses_page.labels.day_plural')} ${$t('trip_expenses_page.stats.overview.days_with_expenses_suffix')}`"
              icon="📅"
              icon-bg-class="bg-blue-100"
            />
          </div>

          <!-- Daily Spending Chart -->
          <ChartsDailySpending :expenses="expenses" :daily-limit="budget.dailyLimit" />

          <!-- Category Breakdown -->
          <ChartsCategoryBreakdown :expenses="expenses" />

          <!-- Payment Methods -->
          <ChartsPaymentMethod :expenses="expenses" />

          <!-- Top Expenses -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">{{ $t('trip_expenses_page.stats.top_expenses.title') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div
                  v-for="(expense, index) in topExpenses"
                  :key="expense.id"
                  class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  @click="handleExpenseClick(expense)"
                >
                  <div class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-semibold text-gray-700">
                    {{ index + 1 }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span>{{ getCategoryInfo(expense.category).icon }}</span>
                      <span class="text-sm font-medium text-gray-900">{{ expense.placeName }}</span>
                    </div>
                    <div class="text-xs text-gray-600">{{ formatDate(expense.timestamp) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-gray-900">{{ formatAmount(expense.amount) }}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- WALLET CONTENT -->
      <TabsContent value="wallet" class="space-y-6">
        <!-- RESUMEN FINANCIERO -->
        <div class="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">{{ $t('trip_expenses_page.wallet.summary.total_invested') }}</CardTitle>
              <TrendingUp class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ formatEUR(totalInvestedEUR) }}</div>
              <p class="text-xs text-muted-foreground">{{ $t('trip_expenses_page.wallet.summary.total_invested_subtitle') }}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">{{ $t('trip_expenses_page.wallet.summary.jpy_available') }}</CardTitle>
              <Wallet class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold" :class="currentJPYBalance < 0 ? 'text-red-500' : 'text-green-600'">
                {{ formatJPY(currentJPYBalance) }}
              </div>
              <p class="text-xs text-muted-foreground">{{ $t('trip_expenses_page.wallet.summary.jpy_available_subtitle') }}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">{{ $t('trip_expenses_page.wallet.summary.total_exchanged') }}</CardTitle>
              <ArrowRightLeft class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ formatJPY(totalJPYAcquired) }}</div>
              <p class="text-xs text-muted-foreground">{{ $t('trip_expenses_page.wallet.summary.total_exchanged_subtitle') }}</p>
            </CardContent>
          </Card>
        </div>

        <!-- ESTADO DE PAGOS -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold tracking-tight">{{ $t('trip_expenses_page.wallet.payments.title') }}</h3>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">{{ $t('trip_expenses_page.wallet.payments.paid_eur') }}</CardTitle>
                <div class="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">{{ formatEUR(paymentBreakdown.eur.paid) }}</div>
                <p class="text-xs text-muted-foreground">{{ $t('trip_expenses_page.wallet.payments.paid_eur_subtitle') }}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">{{ $t('trip_expenses_page.wallet.payments.pending_eur') }}</CardTitle>
                <div class="h-2 w-2 rounded-full bg-orange-500" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold text-orange-600">{{ formatEUR(paymentBreakdown.eur.pending) }}</div>
                <p class="text-xs text-muted-foreground">{{ $t('trip_expenses_page.wallet.payments.pending_eur_subtitle') }}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">{{ $t('trip_expenses_page.wallet.payments.paid_jpy') }}</CardTitle>
                <div class="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">{{ formatJPY(paymentBreakdown.jpy.paid) }}</div>
                <p class="text-xs text-muted-foreground">{{ $t('trip_expenses_page.wallet.payments.paid_jpy_subtitle') }}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">{{ $t('trip_expenses_page.wallet.payments.pending_jpy') }}</CardTitle>
                <div class="h-2 w-2 rounded-full bg-orange-500" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold text-orange-600">{{ formatJPY(paymentBreakdown.jpy.pending) }}</div>
                <p class="text-xs text-muted-foreground">{{ $t('trip_expenses_page.wallet.payments.pending_jpy_subtitle') }}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- LISTA DE CAMBIOS -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <div class="flex items-center gap-2">
              <ArrowRightLeft class="h-5 w-5 text-indigo-500" />
              <CardTitle class="text-lg">{{ $t('trip_expenses_page.wallet.history.title') }}</CardTitle>
            </div>
            <Button size="sm" @click="isWalletModalOpen = true"><Plus class="h-4 w-4 mr-2" /> {{ $t('trip_expenses_page.wallet.history.add') }}</Button>
          </CardHeader>
          <CardContent>
            <div v-if="cambios.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
              <Wallet class="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 class="text-lg font-semibold text-slate-700">{{ $t('trip_expenses_page.wallet.history.empty.title') }}</h3>
              <p class="max-w-md mx-auto mt-2">{{ $t('trip_expenses_page.wallet.history.empty.subtitle') }}</p>
            </div>
            <div v-else class="space-y-2">
              <div v-for="c in cambios" :key="c.id" class="flex justify-between items-center p-3 border rounded hover:bg-slate-50">
                <div>
                  <div class="font-medium flex items-center gap-2">
                    {{ formatEUR(c.origen_eur) }} <span class="text-muted-foreground">➜</span> {{ formatJPY(c.destino_jpy) }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ new Date(c.fecha).toLocaleDateString() }} • {{ c.lugar }} • <span class="capitalize">{{ c.destino_fondo }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-right text-xs text-muted-foreground">
                    {{ $t('trip_expenses_page.wallet.history.rate_prefix') }} {{ (c.destino_jpy / c.origen_eur).toFixed(2) }}
                  </div>
                  <button @click="deleteCambio(c.id)" class="text-red-400 hover:text-red-600"><Trash2 class="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Expense Detail Dialog -->
    <ExpensesDetailDialog
      v-model="showExpenseDetail"
      :expense="selectedExpense"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Wallet Modal -->
    <Dialog v-model:open="isWalletModalOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('trip_expenses_page.wallet.modal.title') }}</DialogTitle>
        </DialogHeader>
        
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div><Label>{{ $t('trip_expenses_page.wallet.modal.fields.given_eur') }}</Label><Input type="number" v-model="walletFormData.origen_eur" /></div>
            <div><Label>{{ $t('trip_expenses_page.wallet.modal.fields.received_jpy') }}</Label><Input type="number" v-model="walletFormData.destino_jpy" /></div>
          </div>
          
          <div><Label>{{ $t('trip_expenses_page.wallet.modal.fields.date') }}</Label><Input type="datetime-local" v-model="walletFormData.fecha" /></div>
          <div><Label>{{ $t('trip_expenses_page.wallet.modal.fields.place') }}</Label><Input v-model="walletFormData.lugar" /></div>
          
          <div>
            <Label>{{ $t('trip_expenses_page.wallet.modal.fields.destination') }}</Label>
            <Select v-model="walletFormData.destino_fondo">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">{{ $t('trip_expenses_page.wallet.modal.destination.cash') }}</SelectItem>
                <SelectItem value="tarjeta">{{ $t('trip_expenses_page.wallet.modal.destination.card') }}</SelectItem>
                <SelectItem value="suica">{{ $t('trip_expenses_page.wallet.modal.destination.suica') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button @click="handleWalletSave">{{ $t('trip_expenses_page.wallet.modal.actions.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
