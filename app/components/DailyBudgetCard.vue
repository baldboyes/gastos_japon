<template>
  <div>
        <!-- Header -->
        <div
          class="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
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
              {{ formatYen(showRemaining ? remaining : todaySpent) }}
            </div>
          </div>
        </div>



<!-- Spent and Remaining 
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div class="text-xs text-teal-100 mb-1">Gastado</div>
            <div class="text-2xl font-bold">
              {{ formatYen(todaySpent) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-teal-100 mb-1">Restante</div>
            <div class="text-2xl font-bold" :class="remaining < 0 ? 'text-red-200' : ''">
              {{ formatYen(budget.dailyLimit) }}
            </div>
          </div>
        </div>
-->
        <!-- Progress Bar -->
        
        <div class="w-full bg-teal-800/30 rounded-full h-6.5 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out text-white text-center"
            :class="progressBarColor"
            :style="{ width: `${Math.min(percentage, 100)}%` }"
          ><span v-if="percentage > 0" class="text-sm">{{ percentage }}%</span></div>
        </div>

  </div>
</template>

<script setup lang="ts">
import { formatYen, calculateBudgetPercentage } from '~/utils/currency'

const STORAGE_KEY = 'daily-budget-display-mode'

const { getStats, getTodaySpent, getTodayRemaining, budget } = useExpenses()

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

const progressBarColor = computed(() => {
  const pct = percentage.value
  if (pct <= 70) return 'bg-teal-800'
  if (pct <= 90) return 'bg-yellow-800'
  return 'bg-red-800'
})

function toggleDisplay() {
  showRemaining.value = !showRemaining.value

  // Save preference to localStorage
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY, showRemaining.value ? 'remaining' : 'spent')
  }
}
</script>
