<script setup lang="ts">
import type { NumberFieldRootEmits, NumberFieldRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { NumberFieldRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NumberFieldRootProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<NumberFieldRootEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <NumberFieldRoot
    data-slot="number-field"
    v-bind="forwarded"
    :class="cn('inline-flex items-center gap-1 rounded-md border border-input bg-white shadow-xs', props.class)"
  >
    <slot />
  </NumberFieldRoot>
</template>
