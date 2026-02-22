<template>
  <div>
    <main>
      <slot />
    </main>
    <Toaster position="top-center" />
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { onMounted } from 'vue'
  import { Bell } from 'lucide-vue-next'
  import { Toaster } from '~/components/ui/sonner'
  import { useNotifications } from '~/composables/useNotifications'

  const { user } = useUser()
  const route = useRoute()
  const { unreadCount, fetchNotifications } = useNotifications()

  onMounted(() => {
    fetchNotifications()
  })


  // Head adicional para PWA
  useHead({
    bodyAttrs: {
      class: 'overflow-hidden'
    }
  })

</script>
