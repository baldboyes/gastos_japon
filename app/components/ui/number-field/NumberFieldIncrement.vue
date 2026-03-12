<script setup lang="ts">
import type { NumberFieldIncrementProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { NumberFieldIncrement, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NumberFieldIncrementProps & { class?: HTMLAttributes["class"] }>()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <NumberFieldIncrement
    data-slot="number-field-increment"
    v-bind="forwarded"
    :class="cn('flex h-8 w-8 items-center justify-center rounded-r-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50', props.class)"
  >
    <slot />
  </NumberFieldIncrement>
</template>
