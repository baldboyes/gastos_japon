<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Gastos por Categoría</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="hasData" class="relative">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="py-12 text-center text-slate-500">
        <div class="text-4xl mb-2">📊</div>
        <p class="text-sm">No hay datos para mostrar</p>
      </div>

      <!-- Legend with totals -->
      <div v-if="hasData" class="mt-6 space-y-2">
        <div
          v-for="(item, index) in categoryBreakdown"
          :key="item.category"
          class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-4 h-4 rounded-full"
              :style="{ backgroundColor: chartColors[index] }"
            />
            <div class="flex items-center gap-2">
              <span>{{ item.info.icon }}</span>
              <span class="text-sm font-medium text-slate-700">{{ item.info.label }}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-slate-900">{{ formatYen(item.total) }}</div>
            <div class="text-xs text-slate-500">{{ item.percentage }}%</div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import type { Expense, ExpenseCategory } from '~/types'
import { getCategoryInfo } from '~/types'
import { formatYen } from '~/utils/currency'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  expenses: Expense[]
}

const props = defineProps<Props>()

const chartColors = [
  '#f97316', // orange (food)
  '#3b82f6', // blue (transport)
  '#a855f7', // purple (accommodation)
  '#ec4899', // pink (entertainment)
  '#10b981', // green (shopping)
  '#6b7280', // gray (other)
]

interface CategoryData {
  category: ExpenseCategory
  total: number
  percentage: number
  info: ReturnType<typeof getCategoryInfo>
}

const categoryBreakdown = computed<CategoryData[]>(() => {
  const totals: Record<ExpenseCategory, number> = {
    food: 0,
    transport: 0,
    accommodation: 0,
    entertainment: 0,
    shopping: 0,
    other: 0
  }

  // Calculate totals per category
  props.expenses.forEach(expense => {
    totals[expense.category] += expense.amount
  })

  // Calculate grand total
  const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0)

  // Build array with percentages
  return Object.entries(totals)
    .filter(([_, total]) => total > 0)
    .map(([category, total]) => ({
      category: category as ExpenseCategory,
      total,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      info: getCategoryInfo(category as ExpenseCategory)
    }))
    .sort((a, b) => b.total - a.total) // Sort by total descending
})

const hasData = computed(() => categoryBreakdown.value.length > 0)

const chartData = computed(() => ({
  labels: categoryBreakdown.value.map(item => item.info.label),
  datasets: [
    {
      data: categoryBreakdown.value.map(item => item.total),
      backgroundColor: categoryBreakdown.value.map((_, i) => chartColors[i]),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 8
    }
  ]
}))

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false // We'll use custom legend
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.parsed
          const percentage = categoryBreakdown.value[context.dataIndex]?.percentage || 0
          return ` ${formatYen(value)} (${percentage}%)`
        }
      }
    }
  },
  cutout: '65%' // Doughnut hole size
}
</script>
