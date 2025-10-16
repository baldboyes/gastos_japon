<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Métodos de Pago</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="hasData" class="space-y-4">
        <!-- Bar Chart -->
        <div class="relative">
          <Bar :data="chartData" :options="chartOptions" />
        </div>

        <!-- Breakdown -->
        <div class="grid grid-cols-2 gap-3 pt-4 border-t">
          <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl">💴</div>
            <div class="flex-1">
              <div class="text-xs text-slate-600">Efectivo</div>
              <div class="text-lg font-bold text-slate-900">{{ formatYen(cashTotal) }}</div>
              <div class="text-xs text-slate-500">{{ cashCount }} {{ cashCount === 1 ? 'gasto' : 'gastos' }}</div>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl">💳</div>
            <div class="flex-1">
              <div class="text-xs text-slate-600">Tarjeta</div>
              <div class="text-lg font-bold text-slate-900">{{ formatYen(cardTotal) }}</div>
              <div class="text-xs text-slate-500">{{ cardCount }} {{ cardCount === 1 ? 'gasto' : 'gastos' }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="py-12 text-center text-slate-500">
        <div class="text-4xl mb-2">💰</div>
        <p class="text-sm">No hay datos para mostrar</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import type { Expense } from '~/types'
import { formatYen } from '~/utils/currency'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  expenses: Expense[]
}

const props = defineProps<Props>()

const cashTotal = computed(() => {
  return props.expenses
    .filter(e => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0)
})

const cardTotal = computed(() => {
  return props.expenses
    .filter(e => e.paymentMethod === 'card')
    .reduce((sum, e) => sum + e.amount, 0)
})

const cashCount = computed(() => {
  return props.expenses.filter(e => e.paymentMethod === 'cash').length
})

const cardCount = computed(() => {
  return props.expenses.filter(e => e.paymentMethod === 'card').length
})

const hasData = computed(() => props.expenses.length > 0)

const chartData = computed(() => ({
  labels: ['Efectivo', 'Tarjeta'],
  datasets: [
    {
      label: 'Gasto total',
      data: [cashTotal.value, cardTotal.value],
      backgroundColor: ['#3b82f6', '#a855f7'], // blue-500, purple-500
      borderColor: ['#2563eb', '#9333ea'], // blue-600, purple-600
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 60
    }
  ]
}))

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.parsed.y
          return ` ${formatYen(value)}`
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
    }
  }
}
</script>
