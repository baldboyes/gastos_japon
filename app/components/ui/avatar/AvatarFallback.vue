<script setup lang="ts">
import { AvatarFallback as AvatarFallbackPrimitive, type AvatarFallbackProps } from 'reka-ui'

const props = defineProps<AvatarFallbackProps>()
</script>

<template>
  <AvatarFallbackPrimitive
    v-bind="props"
    class="flex h-full w-full items-center justify-center rounded-full bg-muted"
  >
    <slot />
  </AvatarFallbackPrimitive>
</template>
