<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { Calendar as CalendarIcon, Bell, LogOut, ChevronsUpDown } from 'lucide-vue-next'
  import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
  } from '~/components/ui/sidebar'
  import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
  } from '~/components/ui/drawer'
  import NotificationsContent from '~/components/notifications/NotificationsContent.vue'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '~/components/ui/dropdown-menu'
  import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
  import { useTrips } from '~/composables/useTrips'
  import { useTripOrganization } from '~/composables/useTripOrganization'

  const route = useRoute()
  const router = useRouter()
  const tripId = route.params.id as string

  const { getTrip, currentTrip } = useTrips()
  const { fetchOrganizationData } = useTripOrganization()
  const user = useUser()
  const clerk = useClerk()

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

  const handleLogout = async () => {
    await clerk.value?.signOut()
    router.push('/')
  }
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
          <Drawer>
            <DrawerTrigger as-child>
              <button class="p-2 text-gray-500 hover:text-gray-700 transition-colors relative hover:cursor-pointer">
                <Bell class="h-5 w-5" />
                <span class="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
              </button>
            </DrawerTrigger>
            <NotificationsContent />
          </Drawer>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <Avatar class="h-8 w-8 rounded-full border border-gray-200">
                  <AvatarImage :src="user.user?.value?.imageUrl || ''" :alt="user.user?.value?.fullName || ''" />
                  <AvatarFallback class="rounded-full">CN</AvatarFallback>
                </Avatar>
                <ChevronsUpDown class="ml-auto size-4 text-gray-400 hidden md:block" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-56 rounded-lg"
              side="bottom"
              align="end"
              :side-offset="4"
            >
              <DropdownMenuLabel class="p-0 font-normal">
                <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar class="h-8 w-8 rounded-full">
                    <AvatarImage :src="user.user?.value?.imageUrl || ''" :alt="user.user?.value?.fullName || ''" />
                    <AvatarFallback class="rounded-full">CN</AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{ user.user?.value?.fullName }}</span>
                    <span class="truncate text-xs">{{ user.user?.value?.primaryEmailAddress?.emailAddress }}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogout">
                <LogOut class="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div class="flex-1 w-full min-w-0 overflow-x-hidden overflow-y-auto">
        <NuxtPage />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
