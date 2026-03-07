<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { computed } from 'vue'

  definePageMeta({
    middleware: 'auth'
  })

  import { Calendar as CalendarIcon } from 'lucide-vue-next'
  import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
  } from '~/components/ui/sidebar'
  import { useTripsNew } from '~/composables/useTripsNew'
  import { useTripOrganizationNew } from '~/composables/useTripOrganizationNew'
  import HeaderUserMenu from '~/components/layout/HeaderUserMenu.vue'

  const route = useRoute()
  const router = useRouter()
  const tripId = route.params.id as string
  const isJoinRoute = computed(() => String(route.path || '').endsWith('/join'))

  const { getTrip, currentTrip } = useTripsNew()
  const { fetchOrganizationData } = useTripOrganizationNew()

  // Cargar datos iniciales (SSR friendly)
  if (!isJoinRoute.value) {
    await useAsyncData(`trip-${tripId}`, async () => {
      if (!currentTrip.value || currentTrip.value.id !== Number(tripId)) {
        await getTrip(Number(tripId))
      }
      await fetchOrganizationData(Number(tripId))
      return true
    }, {
      server: false
    })
  }
</script>
<template>
  <NuxtPage v-if="isJoinRoute" />
  <SidebarProvider v-else>
    <TripsSidebar />
    <SidebarInset class="!bg-gray-50 h-svh">
      <header class="flex h-14 lg:h-20 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-17 px-4 sticky top-0 z-10 border-b-1 border-b-gray-200">
        <SidebarTrigger class="-ml-1" />
        <div class="h-4 w-px mx-2 bg-black" />
        <div class="flex flex-col" v-if="currentTrip">
           <span class="font-semibold text-lg">{{ currentTrip.title }}</span>
           <span class="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon class="h-3 w-3" />
              {{ currentTrip?.start_date ? new Date(currentTrip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '' }} 
              - 
              {{ currentTrip?.end_date ? new Date(currentTrip.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '' }}
           </span>
        </div>
        <div class="ml-auto flex items-center gap-4">
          <HeaderUserMenu />
        </div>
      </header>
      <div class="flex-1 w-full min-w-0 overflow-x-hidden overflow-y-auto">
        <NuxtPage />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
