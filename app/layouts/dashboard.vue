<template>
  <div>
    <main>
      <slot />
    </main>
    <Toaster position="top-center" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { Toaster } from '~/components/ui/sonner'

  onMounted(() => {

  })
  // Head adicional para PWA
  useHead({
    bodyAttrs: {
      class: 'overflow-hidden'
    }
  })
</script>
