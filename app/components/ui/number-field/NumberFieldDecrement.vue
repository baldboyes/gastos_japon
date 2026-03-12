<script setup lang="ts">
import type { NumberFieldDecrementProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { NumberFieldDecrement, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NumberFieldDecrementProps & { class?: HTMLAttributes["class"] }>()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <NumberFieldDecrement
    data-slot="number-field-decrement"
    v-bind="forwarded"
    :class="cn('flex h-8 w-8 items-center justify-center rounded-l-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50', props.class)"
  >
    <slot />
  </NumberFieldDecrement>
</template>
