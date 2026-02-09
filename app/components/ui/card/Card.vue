<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground flex flex-col gap-6 md:rounded-xl md:border py-4 md:py-6 border-gray-200',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
