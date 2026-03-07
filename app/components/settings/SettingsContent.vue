<template>
  <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4">

    <DrawerHeader class="w-full max-w-xl mx-auto px-0">
      <div class="flex items-center justify-between mb-2">
        <DrawerTitle>Configuración del viaje</DrawerTitle>
      </div>
    </DrawerHeader>
    <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
      <div class="max-w-xl mx-auto flex gap-16 flex-col lg:flex-row pr-4 pb-8">

    <div class="space-y-6 w-full">
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
            <CurrencySelector 
              :model-value="selectedCurrency" 
              @update:model-value="handleCurrencyChange" 
            />
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
                    class="bg-white h-14 text-xl"
                    :class="currencyInfo ? 'pl-10 text-lg' : 'text-lg'"
                    :placeholder="currencyInfo ? '8000' : 'Selecciona una moneda primero'"
                    :disabled="!currencyInfo"
                    @blur="handleBudgetChange"
                  />
                </div>
              </div>
            </div>
            <p v-if="displayDailyLimit > 0 && currencyInfo" class="text-xs text-slate-500">
              Presupuesto actual: {{ formatCurrency(displayDailyLimit) }}
            </p>
            <p v-else class="text-xs text-slate-500">
              {{ currencyInfo ? 'Sin presupuesto configurado' : 'Selecciona una moneda para continuar' }}
            </p>
          </div>
        </CardContent>
      </Card>


      <div class="text-center text-sm text-gray-400">
        <span>Versión</span> <span class="font-medium">0.6.5</span>
      </div>
    </div>


      </div>
    </ScrollArea>
  </DrawerContent>


</template>

<script setup lang="ts">
import type { Currency } from '~/types'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { CurrencySelector } from '~/components/ui/CurrencySelector'
import { CURRENCIES } from '~/composables/useSettings'
import { useTripsNew } from '~/composables/useTripsNew'
import { useDirectusRepo } from '~/composables/useDirectusRepo'

const { currentTrip, updateTrip } = useTripsNew()

const selectedCurrency = computed(() => currentTrip.value?.currency || 'JPY')
const currencyInfo = computed(() => {
  const code = currentTrip.value?.currency || 'JPY'
  return CURRENCIES.find(c => c.code === code) || null
})

const dailyLimitInput = ref(
  currentTrip.value 
    ? (currentTrip.value.daily_budget?.toString() || '')
    : ''
)

const displayDailyLimit = computed(() => 
  currentTrip.value 
    ? (currentTrip.value.daily_budget || 0)
    : 0
)

// Watch for budget changes from external sources
watch(() => currentTrip.value, (trip) => {
  if (trip && trip.daily_budget) {
    dailyLimitInput.value = trip.daily_budget.toString()
  }
}, { deep: true })

async function handleCurrencyChange(currency: Currency) {
  if (currentTrip.value) {
    await updateTrip(currentTrip.value.id, { currency: currency })
  }
}

async function handleBudgetChange() {
  const newLimit = parseFloat(dailyLimitInput.value)
  if (!isNaN(newLimit) && newLimit > 0) {
    if (currentTrip.value) {
      await updateTrip(currentTrip.value.id, { daily_budget: newLimit })
    }
  } else {
    // Reset to current budget if invalid
    dailyLimitInput.value = currentTrip.value?.daily_budget?.toString() || ''
  }
}

function formatCurrency(amount: number): string {
  const info = currencyInfo.value
  if (!info) return amount.toLocaleString()
  return `${info.symbol}${amount.toLocaleString()}`
}
</script>
