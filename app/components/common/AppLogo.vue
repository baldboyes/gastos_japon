<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'

const props = defineProps<{
  compact?: boolean
  to?: any
}>()

const { $localeRoute } = useI18n()

const resolvedTo = computed(() => {
  if (!props.to) return $localeRoute({ name: 'home' })
  if (typeof props.to === 'string') return props.to
  return $localeRoute(props.to) || props.to
})
</script>

<template>
  <NuxtLink :to="resolvedTo" class="flex items-center font-bold text-xl text-slate-900 transition-all duration-300" :class="compact ? 'gap-0 ml-2 mt-3' : 'gap-2 -ml-2 -mt-1'">
    <img src="/icon-192x192.png" alt="Logo" class="size-8 transition-transform duration-300" />
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
