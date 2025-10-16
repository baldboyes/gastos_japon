<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Gasto Diario</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="hasData" class="space-y-4">
        <!-- Chart -->
        <div class="relative">
          <Line :data="chartData" :options="chartOptions" />
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-3 pt-4 border-t">
          <div class="text-center">
            <div class="text-xs text-slate-600 mb-1">Promedio</div>
            <div class="text-lg font-bold text-slate-900">{{ formatYen(averageDaily) }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-slate-600 mb-1">Día Mayor</div>
            <div class="text-lg font-bold text-orange-600">{{ formatYen(maxDaily) }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-slate-600 mb-1">Día Menor</div>
            <div class="text-lg font-bold text-teal-600">{{ formatYen(minDaily) }}</div>
          </div>
        </div>
      </div>
      <div v-else class="py-12 text-center text-slate-500">
        <div class="text-4xl mb-2">📈</div>
        <p class="text-sm">No hay datos para mostrar</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js'
import type { Expense } from '~/types'
import { formatYen } from '~/utils/currency'
import { formatDate, groupByDate } from '~/utils/dates'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  expenses: Expense[]
  dailyLimit?: number
}

const props = withDefaults(defineProps<Props>(), {
  dailyLimit: 8000
})

interface DailyData {
  date: string
  total: number
  displayDate: string
}

const dailyData = computed<DailyData[]>(() => {
  const grouped = groupByDate(props.expenses)

  // Convert to array and sort by date (oldest first for chart)
  return Object.entries(grouped)
    .map(([date, expenses]) => ({
      date,
      total: expenses.reduce((sum, e) => sum + e.amount, 0),
      displayDate: formatShortDate(date)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
})

const hasData = computed(() => dailyData.value.length > 0)

const averageDaily = computed(() => {
  if (dailyData.value.length === 0) return 0
  const total = dailyData.value.reduce((sum, day) => sum + day.total, 0)
  return Math.round(total / dailyData.value.length)
})

const maxDaily = computed(() => {
  if (dailyData.value.length === 0) return 0
  return Math.max(...dailyData.value.map(d => d.total))
})

const minDaily = computed(() => {
  if (dailyData.value.length === 0) return 0
  return Math.min(...dailyData.value.map(d => d.total))
})

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' })
  return `${day} ${month}`
}

const chartData = computed(() => ({
  labels: dailyData.value.map(d => d.displayDate),
  datasets: [
    {
      label: 'Gasto Diario',
      data: dailyData.value.map(d => d.total),
      borderColor: '#14b8a6', // teal-500
      backgroundColor: 'rgba(20, 184, 166, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#14b8a6',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2
    },
    // Budget line
    {
      label: 'Límite Diario',
      data: dailyData.value.map(() => props.dailyLimit),
      borderColor: '#ef4444', // red-500
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0
    }
  ]
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: true,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y
          return `${label}: ${formatYen(value)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `¥${value.toLocaleString()}`
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}
</script>
