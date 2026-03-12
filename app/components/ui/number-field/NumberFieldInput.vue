<script setup lang="ts">
import type { NumberFieldInputProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { NumberFieldInput, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NumberFieldInputProps & { class?: HTMLAttributes["class"] }>()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <NumberFieldInput
    data-slot="number-field-input"
    v-bind="forwarded"
    :class="cn('h-8 w-12 bg-transparent px-2 text-center text-sm tabular-nums outline-none', props.class)"
  />
</template>
