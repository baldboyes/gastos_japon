<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">{{ t('settings.trip_settings_drawer.currency.title') }}</CardTitle>
      <CardDescription>{{ t('settings.trip_settings_drawer.currency.description') }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <CurrencySelector :model-value="selectedCurrency" @update:model-value="handleCurrencyChange" />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { CurrencySelector } from '~/components/ui/CurrencySelector'
import { useTripsNew } from '~/composables/useTripsNew'
import { useI18n } from '#imports'

const { t } = useI18n()
const { currentTrip, updateTrip } = useTripsNew()

const selectedCurrency = computed(() => currentTrip.value?.currency || 'JPY')

async function handleCurrencyChange(currency: string) {
  if (currentTrip.value) {
    await updateTrip(currentTrip.value.id, { currency })
  }
}
</script>
