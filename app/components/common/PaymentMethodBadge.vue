<template>
  <Badge
    variant="outline"
    class="text-xs flex items-center gap-1"
    :class="classes"
  >
    <template v-if="method === 'cash'">
      <span>💴</span> Efectivo
    </template>
    <template v-else-if="method === 'card'">
      <span>💳</span> Tarjeta
    </template>
    <template v-else-if="method === 'ic'">
      <img v-if="useIcon" src="/ic.webp" alt="IC" class="w-3 h-3 object-contain" />
      <span v-else>🎫</span>
      IC
    </template>
    <slot />
  </Badge>
</template>

<script setup lang="ts">
import type { PaymentMethod } from '~/types'

interface Props {
  method: PaymentMethod
  useIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  useIcon: false
})

const classes = computed(() => {
  switch (props.method) {
    case 'cash':
      return 'border-green-300 text-green-700 bg-green-50'
    case 'card':
      return 'border-blue-300 text-blue-700 bg-blue-50'
    case 'ic':
      return 'border-orange-300 text-orange-700 bg-orange-50'
    default:
      return ''
  }
})
</script>
