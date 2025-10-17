<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- First Time Setup Banner -->
      <div v-if="isFirstTime" class="mb-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl">
        <div class="flex items-start gap-3">
          <div class="text-3xl">👋</div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 mb-1">¡Bienvenido!</h2>
            <p class="text-sm text-slate-700">
              Antes de comenzar, configura tu moneda y presupuesto diario para tener una mejor experiencia.
            </p>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 mb-2">Ajustes</h1>
        <p class="text-sm text-slate-600">
          Configura la aplicación según tus preferencias
        </p>
      </div>

      <!-- Settings Sections -->
      <div class="space-y-6">
        <!-- Currency Setting -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Moneda</CardTitle>
            <CardDescription>
              Selecciona la moneda que utilizarás en tus gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <button
                v-for="currency in CURRENCIES"
                :key="currency.code"
                @click="handleCurrencyChange(currency.code)"
                class="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:border-teal-300"
                :class="[
                  selectedCurrency === currency.code
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white'
                ]"
              >
                <div class="flex items-center gap-3">
                  <span class="text-3xl">{{ currency.flag }}</span>
                  <div class="text-left">
                    <div class="font-semibold text-slate-900">{{ currency.name }}</div>
                    <div class="text-sm text-slate-600">
                      {{ currency.code }} ({{ currency.symbol }})
                    </div>
                  </div>
                </div>
                <div v-if="selectedCurrency === currency.code" class="text-teal-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <!-- Budget Setting -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Presupuesto Diario</CardTitle>
            <CardDescription>
              Establece tu límite de gasto diario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <Label for="dailyLimit" class="text-sm">Límite Diario</Label>
                  <div class="relative mt-2">
                    <span v-if="currencyInfo" class="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-600">
                      {{ currencyInfo.symbol }}
                    </span>
                    <Input
                      id="dailyLimit"
                      v-model="dailyLimitInput"
                      type="number"
                      min="0"
                      step="100"
                      :class="currencyInfo ? 'pl-10 text-lg' : 'text-lg'"
                      :placeholder="currencyInfo ? '8000' : 'Selecciona una moneda primero'"
                      :disabled="!currencyInfo"
                      @blur="handleBudgetChange"
                    />
                  </div>
                </div>
              </div>
              <p v-if="budget.dailyLimit > 0 && currencyInfo" class="text-xs text-slate-500">
                Presupuesto actual: {{ formatCurrency(budget.dailyLimit) }}
              </p>
              <p v-else class="text-xs text-slate-500">
                {{ currencyInfo ? 'Sin presupuesto configurado' : 'Selecciona una moneda para continuar' }}
              </p>
            </div>
          </CardContent>
        </Card>
        <div class="text-center text-sm text-gray-400">
          <span>Versión</span> <span class="font-medium">1.0.4</span>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { CURRENCIES, type Currency } from '~/composables/useSettings'

const { settings, setCurrency, getCurrencyInfo } = useSettings()
const { budget, updateBudget, expenses, getTotalSpent } = useExpenses()
const { markSetupComplete, isSetupComplete } = useFirstTimeSetup()

const selectedCurrency = computed(() => settings.value.currency)
const currencyInfo = computed(() => getCurrencyInfo())
const dailyLimitInput = ref(budget.value.dailyLimit > 0 ? budget.value.dailyLimit.toString() : '')
const totalSpent = computed(() => getTotalSpent())
const isFirstTime = ref(!isSetupComplete())

// Watch for budget changes from external sources
watch(() => budget.value.dailyLimit, (newLimit) => {
  dailyLimitInput.value = newLimit.toString()
})

function handleCurrencyChange(currency: Currency) {
  setCurrency(currency)
  // Mark setup as complete when currency is changed
  markSetupComplete()
  isFirstTime.value = false
}

function handleBudgetChange() {
  const newLimit = parseFloat(dailyLimitInput.value)
  if (!isNaN(newLimit) && newLimit > 0) {
    updateBudget({ dailyLimit: newLimit })
    // Mark setup as complete when budget is set
    markSetupComplete()
    isFirstTime.value = false
  } else {
    // Reset to current budget if invalid
    dailyLimitInput.value = budget.value.dailyLimit.toString()
  }
}

function formatCurrency(amount: number): string {
  const info = getCurrencyInfo()
  if (!info) return amount.toLocaleString()
  return `${info.symbol}${amount.toLocaleString()}`
}
</script>
