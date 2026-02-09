<script setup lang="ts">
import { AvatarRoot } from 'reka-ui'
import { type HTMLAttributes, computed } from 'vue'
import { avatarVariant, type AvatarVariants } from '.'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    size?: AvatarVariants['size']
    shape?: AvatarVariants['shape']
  }>(),
  {
    size: 'base',
    shape: 'circle',
  },
)
</script>

<template>
  <AvatarRoot :class="cn(avatarVariant({ size, shape }), props.class)">
    <slot />
  </AvatarRoot>
</template>
