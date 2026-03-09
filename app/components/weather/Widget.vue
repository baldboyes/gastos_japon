<template>
  <div v-if="weather && weather.weather && weather.weather.length > 0" class="flex items-center gap-2">
    <img
      v-if="weather.weather[0].icon"
      :src="`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`"
      :alt="weather.weather[0].description"
      class="h-10 w-10"
    />
    <div class="flex flex-col text-xs text-neutral-600">
      <span class="font-semibold text-neutral-900">{{ Math.round(weather.main.temp) }}°C</span>
      <span class="capitalize">{{ weather.weather[0].description }}</span>
    </div>
  </div>
  <div v-else-if="loading" class="h-10 w-10 animate-pulse bg-neutral-200 rounded-full"></div>
  <Sun v-else class="h-8 w-8 text-orange-400" />
</template>

<script setup lang="ts">
import { Sun } from 'lucide-vue-next'

defineProps<{
  weather: any
  loading?: boolean
}>()
</script>
