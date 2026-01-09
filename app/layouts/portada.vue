<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Main content -->
    <main class="pb-20">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-slate-900 z-50">
      <div class="max-w-screen-sm mx-auto">
        <div class="flex items-center justify-around pt-2 pb-4">
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

          <!-- Gastos -->
          <NuxtLink
            to="/gastos"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/gastos') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
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

          <!-- Add Expense -->
          <NuxtLink
            to="/add"
            class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors"
            :class="isActive('/add') ? 'text-teal-500' : 'text-gray-400 hover:text-gray-200'"
          >
            <div class="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center shadow-lg -mt-10 border-4 border-gray-50">
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

            <!-- Profile -->
            <SignedIn>
              <div class="flex flex-col items-center gap-1 px-4 py-2 justify-center min-h-[44px]">
                <div v-if="user?.imageUrl" class="w-8 h-8 rounded-full overflow-hidden ">
                  <img :src="user.imageUrl" alt="Perfil" class="w-full h-full object-cover" />
                </div>
              </div>
            </SignedIn>
            <SignedOut>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </SignedOut>


          </NuxtLink>



        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'

  const { user } = useUser()
  const route = useRoute()

  function isActive(path: string): boolean {
    if (path === '/') {
      return route.path === '/'
    }
    return route.path.startsWith(path)
  }
</script>

