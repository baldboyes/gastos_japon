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
        <div class="grid grid-cols-3 gap-3 pt-4 border-t text-center">
          <div class="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded-lg">
            <div class="text-2xl">💴</div>
            <div class="flex-1">
              <div class="text-xs text-gray-600">Efectivo</div>
              <div class="text-lg font-bold text-gray-900">{{ formatAmount(cashTotal) }}</div>
              <div class="text-xs text-gray-500">{{ cashCount }} {{ cashCount === 1 ? 'gasto' : 'gastos' }}</div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-1 p-2 bg-purple-50 rounded-lg">
            <div class="text-2xl">💳</div>
            <div class="flex-1">
              <div class="text-xs text-gray-600">Tarjeta</div>
              <div class="text-lg font-bold text-gray-900">{{ formatAmount(cardTotal) }}</div>
              <div class="text-xs text-gray-500">{{ cardCount }} {{ cardCount === 1 ? 'gasto' : 'gastos' }}</div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-1 p-2 bg-orange-50 rounded-lg">
            <div class="text-2xl"><img src="/ic.webp" alt="IC" class="w-8 h-8" /></div>
            <div class="flex-1">
              <div class="text-xs text-gray-600">IC</div>
              <div class="text-lg font-bold text-gray-900">{{ formatAmount(icTotal) }}</div>
              <div class="text-xs text-gray-500">{{ icCount }} {{ icCount === 1 ? 'gasto' : 'gastos' }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="py-12 text-center text-gray-500">
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

const { formatAmount, currencySymbol } = useCurrency()

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

const icTotal = computed(() => {
  return props.expenses
    .filter(e => e.paymentMethod === 'ic')
    .reduce((sum, e) => sum + e.amount, 0)
})

const cashCount = computed(() => {
  return props.expenses.filter(e => e.paymentMethod === 'cash').length
})

const cardCount = computed(() => {
  return props.expenses.filter(e => e.paymentMethod === 'card').length
})

const icCount = computed(() => {
  return props.expenses.filter(e => e.paymentMethod === 'ic').length
})

const hasData = computed(() => props.expenses.length > 0)

const chartData = computed(() => ({
  labels: ['Efectivo', 'Tarjeta', 'IC'],
  datasets: [
    {
      label: 'Gasto total',
      data: [cashTotal.value, cardTotal.value, icTotal.value],
      backgroundColor: ['#3b82f6', '#a855f7', '#f97316'], // blue-500, purple-500, orange-500
      borderColor: ['#2563eb', '#9333ea', '#ea580c'], // blue-600, purple-600, orange-600
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 50
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
          return ` ${formatAmount(value)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `${currencySymbol.value}${value.toLocaleString()}`
      }
    }
  }
}
</script>
