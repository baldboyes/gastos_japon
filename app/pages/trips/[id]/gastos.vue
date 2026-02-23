<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ formatAmount(totalAmount) }}</h1>
          <div class="text-sm text-gray-600">
            {{ totalExpenses }} {{ totalExpenses === 1 ? 'gasto' : 'gastos' }}
          </div>
        </div>
      </div>
      
      <!-- View Mode Tabs with Filters Popover -->
      <Tabs v-model="viewMode" class="w-full mb-6">
        <div class="flex items-center gap-2 mb-4">
          <TabsList class="flex-1 grid grid-cols-3">
            <TabsTrigger value="list" class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list">
                <line x1="8" x2="21" y1="6" y2="6"/>
                <line x1="8" x2="21" y1="12" y2="12"/>
                <line x1="8" x2="21" y1="18" y2="18"/>
                <line x1="3" x2="3.01" y1="6" y2="6"/>
                <line x1="3" x2="3.01" y1="12" y2="12"/>
                <line x1="3" x2="3.01" y1="18" y2="18"/>
              </svg>
              <span class="hidden sm:inline">Historial</span>
              <span class="sm:hidden">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="map" class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="hidden sm:inline">Mapa</span>
              <span class="sm:hidden">Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="stats" class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-3">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
              <span class="hidden sm:inline">Estadísticas</span>
              <span class="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <!-- Filters Popover -->
          <Popover>
            <PopoverTrigger as-child>
              <Button 
                variant="outline" 
                size="icon" 
                :class="hasFilters ? 'text-teal-600 border-teal-600 bg-teal-50' : ''"
                :disabled="viewMode === 'stats'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-filter">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80" align="end">
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
                @clear="handleClearFilters"
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Active Filters Summary (Outside Popover) -->
        <div v-if="viewMode !== 'stats' && hasFilters" class="mb-4">
          <ExpensesActiveFilters
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
        <div v-if="viewMode !== 'stats' && hasFilters && filteredExpenses.length > 0" class="mb-4">
          <div class="text-sm text-gray-600 bg-teal-50 px-4 py-2 rounded-lg">
            Mostrando {{ filteredExpenses.length }} {{ filteredExpenses.length === 1 ? 'resultado' : 'resultados' }}
            • Total: {{ formatAmount(filteredTotal) }}
          </div>
        </div>

        <!-- LIST CONTENT -->
        <TabsContent value="list">
          <ExpensesGroupedList
            :expenses="filteredExpenses"
            :planned-expenses="filteredPlannedExpenses"
            empty-title="Sin gastos"
            empty-message="No se encontraron gastos con los filtros aplicados"
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
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Sin Estadísticas</h2>
            <p class="text-gray-600 mb-6">
              Agrega algunos gastos para ver tus estadísticas
            </p>
            <Button @click="navigateTo('/add')" class="bg-teal-600 h-14 text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <path d="M12 5v14"/><path d="M5 12h14"/>
              </svg>
              Agregar Gasto
            </Button>
          </div>

          <!-- Statistics Content -->
          <div v-else class="space-y-6">
            <!-- Overview Cards -->
            <div class="grid grid-cols-2 gap-4">
              <DashboardStatsCard
                label="Total"
                :value="formatAmount(totalSpent)"
                :subtitle="`${expenses.length} ${expenses.length === 1 ? 'gasto' : 'gastos'}`"
                icon="💰"
                icon-bg-class="bg-teal-100"
              />
              <DashboardStatsCard
                label="Promedio Día"
                :value="formatAmount(averageDaily)"
                :subtitle="`${tripDays} ${tripDays === 1 ? 'día' : 'días'} con gastos`"
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
                <CardTitle class="text-lg">Gastos Más Grandes</CardTitle>
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
      </Tabs>
      

      <!-- Expense Detail Dialog -->
      <ExpensesDetailDialog
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
import { getCategoryInfo } from '~/types'
import type { DateFilterRange } from '~/components/common/DateRangeFilter.vue'
import { formatDate, getDateString } from '~/utils/dates'
import { groupByDate } from '~/utils/grouping'

const { formatAmount } = useCurrency()
const router = useRouter()
const { expenses, plannedExpenses, deleteExpense, addExpense, deletePlannedExpense, budget } = useExpenses()

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
