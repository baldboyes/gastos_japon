<script setup lang="ts">
import { AvatarImage as AvatarImagePrimitive, type AvatarImageProps } from 'reka-ui'

const props = defineProps<AvatarImageProps>()
</script>

<template>
  <AvatarImagePrimitive
    v-bind="props"
    class="h-full w-full object-cover" style="image-rendering: auto;"
  />
</template>
