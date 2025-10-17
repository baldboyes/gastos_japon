<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main content -->
    <main class="pb-20">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
      <div class="max-w-screen-sm mx-auto">
        <div class="flex items-center justify-around py-3">
          <!-- Home -->
          <NuxtLink
            to="/"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </NuxtLink>

          <!-- History -->
          <NuxtLink
            to="/history"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/history') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list">
              <line x1="8" x2="21" y1="6" y2="6"/>
              <line x1="8" x2="21" y1="12" y2="12"/>
              <line x1="8" x2="21" y1="18" y2="18"/>
              <line x1="3" x2="3.01" y1="6" y2="6"/>
              <line x1="3" x2="3.01" y1="12" y2="12"/>
              <line x1="3" x2="3.01" y1="18" y2="18"/>
            </svg>
          </NuxtLink>

          <!-- Stats -->
          <NuxtLink
            to="/stats"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/stats') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-3">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </NuxtLink>

          <!-- Map -->
          <NuxtLink
            to="/map"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/map') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map">
              <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/>
              <path d="M15 5.764v15"/>
              <path d="M9 3.236v15"/>
            </svg>
          </NuxtLink>

          <!-- Add Expense -->
          <NuxtLink
            to="/add"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/add') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
          >
            <div class="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
              </svg>
            </div>
          </NuxtLink>

          <!-- Settings -->
          <NuxtLink
            to="/settings"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/settings') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'

  const route = useRoute()

  function isActive(path: string): boolean {
    if (path === '/') {
      return route.path === '/'
    }
    return route.path.startsWith(path)
  }
</script>
