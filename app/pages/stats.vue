<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Estadísticas</h1>
      </div>

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
          <StatsCard
            label="Total Gastado"
            :value="formatAmount(totalSpent)"
            :subtitle="`${expenses.length} ${expenses.length === 1 ? 'gasto' : 'gastos'}`"
            icon="💰"
            icon-bg-class="bg-teal-100"
          />
          <StatsCard
            label="Promedio Diario"
            :value="formatAmount(averageDaily)"
            :subtitle="`${tripDays} ${tripDays === 1 ? 'día' : 'días'} con gastos`"
            icon="📅"
            icon-bg-class="bg-blue-100"
          />
          <StatsCard
            label="Gasto Mayor"
            :value="formatAmount(maxExpense?.amount || 0)"
            :subtitle="maxExpense?.placeName"
            icon="📈"
            icon-bg-class="bg-orange-100"
          />
          <StatsCard
            label="Gasto Menor"
            :value="formatAmount(minExpense?.amount || 0)"
            :subtitle="minExpense?.placeName"
            icon="📉"
            icon-bg-class="bg-green-100"
          />
        </div>

        <!-- Daily Spending Chart -->
        <DailySpendingChart :expenses="expenses" :daily-limit="budget.dailyLimit" />

        <!-- Category Breakdown -->
        <CategoryBreakdownChart :expenses="expenses" />

        <!-- Payment Methods -->
        <PaymentMethodChart :expenses="expenses" />

        <!-- Location Stats -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Ubicaciones Visitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="location in topLocations"
                :key="location.key"
                class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-teal-600">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ location.city }}</div>
                    <div class="text-xs text-gray-500">{{ location.count }} {{ location.count === 1 ? 'gasto' : 'gastos' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900">{{ formatAmount(location.total) }}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        <!-- Shared Expenses -->
        <Card v-if="sharedExpenses.length > 0">
          <CardHeader>
            <CardTitle class="text-lg">Gastos Compartidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">👥</span>
                  <div>
                    <div class="text-sm font-medium text-gray-900">Total Compartido</div>
                    <div class="text-xs text-gray-600">{{ sharedExpenses.length }} {{ sharedExpenses.length === 1 ? 'gasto' : 'gastos' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-gray-900">{{ formatAmount(sharedTotal) }}</div>
                  <div class="text-xs text-gray-600">Tu parte: {{ formatAmount(Math.round(sharedTotal / 2)) }}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Expense Detail Dialog -->
      <ExpenseDetailDialog
        v-model="showExpenseDetail"
        :expense="selectedExpense"
        read-only
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { Expense } from '~/types'
import { getCategoryInfo } from '~/types'
import { formatDate, formatTime, groupByDate } from '~/utils/dates'

const { formatAmount } = useCurrency()
const { expenses, budget } = useExpenses()

// Dialog state
const showExpenseDetail = ref(false)
const selectedExpense = ref<Expense | null>(null)

// Overall stats
const totalSpent = computed(() => expenses.value.reduce((sum, e) => sum + e.amount, 0))

const tripDays = computed(() => {
  const dates = Object.keys(groupByDate(expenses.value))
  return dates.length
})

const averageDaily = computed(() => {
  if (tripDays.value === 0) return 0
  return Math.round(totalSpent.value / tripDays.value)
})

const maxExpense = computed(() => {
  if (expenses.value.length === 0) return null
  return expenses.value.reduce((max, e) => e.amount > max.amount ? e : max, expenses.value[0])
})

const minExpense = computed(() => {
  if (expenses.value.length === 0) return null
  return expenses.value.reduce((min, e) => e.amount < min.amount ? e : min, expenses.value[0])
})

// Top expenses
const topExpenses = computed(() => {
  return [...expenses.value]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})

// Location stats
interface LocationStats {
  key: string
  city: string
  prefecture: string
  total: number
  count: number
}

const topLocations = computed<LocationStats[]>(() => {
  const locationMap = new Map<string, LocationStats>()

  expenses.value.forEach(expense => {
    const key = `${expense.location.city}-${expense.location.prefecture}`

    if (locationMap.has(key)) {
      const existing = locationMap.get(key)!
      existing.total += expense.amount
      existing.count += 1
    } else {
      locationMap.set(key, {
        key,
        city: expense.location.city,
        prefecture: expense.location.prefecture,
        total: expense.amount,
        count: 1
      })
    }
  })

  return Array.from(locationMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
})

// Shared expenses
const sharedExpenses = computed(() => expenses.value.filter(e => e.shared))
const sharedTotal = computed(() => sharedExpenses.value.reduce((sum, e) => sum + e.amount, 0))

// Handlers
function handleExpenseClick(expense: Expense) {
  selectedExpense.value = expense
  showExpenseDetail.value = true
}
</script>
