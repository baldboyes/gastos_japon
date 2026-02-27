<script setup lang="ts">
import { useI18n } from '#imports'

defineProps<{
  compact?: boolean
}>()

const { $localeRoute } = useI18n()
</script>

<template>
  <NuxtLink :to="$localeRoute({ name: 'home' })" class="flex items-center gap-2 font-bold text-xl text-slate-900 transition-all duration-300">
    <img src="/icon-192x192.png" alt="Logo" class="size-8 transition-transform duration-300" :class="{ 'scale-110': compact }" />
    <span 
      class="truncate font-semibold text-xl transition-all duration-300 origin-left text-red-400"
      :class="[
        compact ? 'w-0 opacity-0 scale-x-0 overflow-hidden' : 'w-auto opacity-100 scale-x-100'
      ]"
    >
      jizou.io
    </span>
  </NuxtLink>
</template>
