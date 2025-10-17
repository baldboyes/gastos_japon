<template>
  <div>
    <div class="flex items-center justify-between mt-12 mb-4">
        <!-- Header -->
        <div
          class="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
          @click="toggleDisplay"
        >
          <div class="flex-1 space-y-0">
            <div class="text-xs text-gray-400 font-normal">
              {{ showRemaining ? 'Restante hoy' : 'Gastado hoy' }}
            </div>
            <div
              class="text-6xl font-bold mb-1 -mt-1"
              :class="showRemaining && remaining < 0 ? 'text-red-600' : 'text-gray-900'"
            >
              {{ formatAmount(showRemaining ? remaining : todaySpent) }}
            </div>
          </div>
        </div>

        <!-- Donut Chart -->
        <div v-if="showRemaining" class="flex justify-center opacity-90">
          <div class="relative w-18 h-18">
            <!-- SVG Donut -->
            <svg class="transform -rotate-90 w-18 h-18" viewBox="0 0 120 120">
              <!-- Background circle -->
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="20"
              />
              <!-- Progress circle -->
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                :stroke="donutColor"
                stroke-width="20"
                :stroke-dasharray="`${circumference} ${circumference}`"
                :stroke-dashoffset="strokeDashoffset"
                stroke-linecap="round"
                class="transition-all duration-500 ease-out"
              />
            </svg>
            <!-- Percentage text in center -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-sm font-bold" :class="percentage > 100 ? 'text-red-600' : 'text-gray-900'">
                {{ percentage }}%
              </span>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calculateBudgetPercentage } from '~/utils/currency'

const STORAGE_KEY = 'daily-budget-display-mode'

const { getStats, getTodaySpent, getTodayRemaining, budget } = useExpenses()
const { formatAmount } = useCurrency()

// Load preference from localStorage
const showRemaining = ref(true)

onMounted(() => {
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      showRemaining.value = stored === 'remaining'
    }
  }
})

const todaySpent = computed(() => getTodaySpent())
const remaining = computed(() => getTodayRemaining())
const percentage = computed(() =>
  calculateBudgetPercentage(todaySpent.value, budget.value.dailyLimit)
)

// Donut chart calculations
const radius = 50
const circumference = 2 * Math.PI * radius

const strokeDashoffset = computed(() => {
  const progress = Math.min(percentage.value, 100) / 100
  return circumference * (1 - progress)
})

const donutColor = computed(() => {
  const pct = percentage.value
  if (pct <= 70) return '#115e59' // teal-800
  if (pct <= 90) return '#854d0e' // yellow-800
  return '#991b1b' // red-800
})

function toggleDisplay() {
  showRemaining.value = !showRemaining.value

  // Save preference to localStorage
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, showRemaining.value ? 'remaining' : 'spent')
  }
}
</script>
