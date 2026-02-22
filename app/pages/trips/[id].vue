<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { Calendar as CalendarIcon } from 'lucide-vue-next'
  import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
  } from '~/components/ui/sidebar'
  import { useTrips } from '~/composables/useTrips'
  import { useTripOrganization } from '~/composables/useTripOrganization'
  import HeaderUserMenu from '~/components/layout/HeaderUserMenu.vue'

  const route = useRoute()
  const router = useRouter()
  const tripId = route.params.id as string

  const { getTrip, currentTrip } = useTrips()
  const { fetchOrganizationData } = useTripOrganization()

  // Cargar datos iniciales (SSR friendly)
  await useAsyncData(`trip-${tripId}`, async () => {
    if (!currentTrip.value || currentTrip.value.id !== tripId) {
      await getTrip(tripId)
    }
    // Cargar datos de organización también para que estén disponibles en sub-páginas
    await fetchOrganizationData(tripId)
    return true
  }, {
    server: false
  })
</script>
<template>
  <SidebarProvider>
    <TripSidebar />
    <SidebarInset class="!bg-gray-50 h-svh">
      <header class="flex h-20 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-17 px-4 sticky top-0 z-10">
        <SidebarTrigger class="-ml-1" />
        <div class="h-4 w-px mx-2 bg-black" />
        <div class="flex flex-col" v-if="currentTrip">
           <span class="font-semibold text-lg">{{ currentTrip.nombre }}</span>
           <span class="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon class="h-3 w-3" />
              {{ currentTrip?.fecha_inicio ? new Date(currentTrip.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '' }} 
              - 
              {{ currentTrip?.fecha_fin ? new Date(currentTrip.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '' }}
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
