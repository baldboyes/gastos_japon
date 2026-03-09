<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">{{ t('settings.trip_settings_drawer.daily_budget.title') }}</CardTitle>
      <CardDescription>{{ t('settings.trip_settings_drawer.daily_budget.description') }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <Label for="dailyLimit" class="text-sm">{{ t('settings.trip_settings_drawer.daily_budget.label') }}</Label>
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
                :placeholder="currencyInfo ? String(t('settings.trip_settings_drawer.daily_budget.placeholder_amount')) : String(t('settings.trip_settings_drawer.daily_budget.placeholder_select_currency'))"
                :disabled="!currencyInfo"
                @blur="handleBudgetChange"
              />
            </div>
          </div>
        </div>
        <p v-if="displayDailyLimit > 0 && currencyInfo" class="text-xs text-slate-500">
          {{ t('settings.trip_settings_drawer.daily_budget.current_prefix') }} {{ formatCurrency(displayDailyLimit) }}
        </p>
        <p v-else class="text-xs text-slate-500">
          {{ currencyInfo ? t('settings.trip_settings_drawer.daily_budget.none_configured') : t('settings.trip_settings_drawer.daily_budget.select_currency_hint') }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { CURRENCIES } from '~/composables/useSettings'
import { useTripsNew } from '~/composables/useTripsNew'
import { useI18n } from '#imports'

const { t } = useI18n()
const { currentTrip, updateTrip } = useTripsNew()

const currencyInfo = computed(() => {
  const code = currentTrip.value?.currency || 'JPY'
  return CURRENCIES.find(c => c.code === code) || null
})

const dailyLimitInput = ref(currentTrip.value ? (currentTrip.value.daily_budget?.toString() || '') : '')

const displayDailyLimit = computed(() => (currentTrip.value ? (currentTrip.value.daily_budget || 0) : 0))

watch(
  () => currentTrip.value,
  (trip) => {
    if (trip && trip.daily_budget) {
      dailyLimitInput.value = trip.daily_budget.toString()
    }
  },
  { deep: true }
)

async function handleBudgetChange() {
  const newLimit = parseFloat(dailyLimitInput.value)
  if (!isNaN(newLimit) && newLimit > 0) {
    if (currentTrip.value) {
      await updateTrip(currentTrip.value.id, { daily_budget: newLimit })
    }
  } else {
    dailyLimitInput.value = currentTrip.value?.daily_budget?.toString() || ''
  }
}

function formatCurrency(amount: number): string {
  const info = currencyInfo.value
  if (!info) return amount.toLocaleString()
  return `${info.symbol}${amount.toLocaleString()}`
}
</script>
