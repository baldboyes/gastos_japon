<script setup lang="ts">
const props = defineProps<{ class?: string }>()
</script>

<template>
  <li>
    <slot />
  </li>
</template>
