<template>
  <div class="grid grid-cols-3 gap-3">
    <!-- Total Spent -->
    <Card class="hover:shadow-md transition-shadow">
      <CardContent class="px-4">
        <div class="text-center">
          <div class="text-2xl mb-1">💰</div>
          <div class="text-xs text-slate-600 mb-1">Total Gastado</div>
          <div class="text-lg font-bold text-slate-900">
            {{ formatYenCompact(stats.totalSpent) }}
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Days Elapsed -->
    <Card class="hover:shadow-md transition-shadow">
      <CardContent class="px-4">
        <div class="text-center">
          <div class="text-2xl mb-1">📅</div>
          <div class="text-xs text-slate-600 mb-1">Días</div>
          <div class="text-lg font-bold text-slate-900">
            {{ daysElapsed }}
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Average Daily -->
    <Card class="hover:shadow-md transition-shadow">
      <CardContent class="px-4">
        <div class="text-center">
          <div class="text-2xl mb-1">📊</div>
          <div class="text-xs text-slate-600 mb-1">Promedio/Día</div>
          <div class="text-lg font-bold text-slate-900">
            {{ formatYenCompact(stats.averageDaily) }}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { formatYenCompact } from '~/utils/currency'
import { getDaysElapsed } from '~/utils/dates'

const { getStats, budget } = useExpenses()

const stats = computed(() => getStats())

const daysElapsed = computed(() => {
  if (!budget.value.startDate) return 1
  return getDaysElapsed(budget.value.startDate)
})
</script>
