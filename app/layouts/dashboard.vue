<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Notifications Icon -->
    <div class="fixed bottom-4 left-4 z-40">
      <NuxtLink to="/notifications" class="relative inline-flex items-center justify-center p-2 rounded-full bg-white shadow-md text-gray-500 hover:text-teal-600 transition-colors">
        <Bell class="w-6 h-6" />
        <span v-if="unreadCount > 0" class="absolute top-0 right-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
          {{ unreadCount }}
        </span>
      </NuxtLink>
    </div>

    <!-- Main content -->
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
