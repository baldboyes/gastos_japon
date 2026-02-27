<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Plane, BedDouble, Train, Ticket, Shield, Wallet, Users, CalendarRange, ListTodo, Settings, Eye, Banknote, History } from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarRail,
  useSidebar
} from '~/components/ui/sidebar'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '~/components/ui/drawer'
import AppLogo from '~/components/common/AppLogo.vue'
import SettingsContent from '~/components/settings/SettingsContent.vue'
import { useTrips } from '~/composables/useTrips'
import { getLocalePrefixFromPath } from '~/components/ui/sidebar/utils'

const route = useRoute()
const router = useRouter()
const tripId = route.params.id as string

const { currentTrip } = useTrips()
const { setOpenMobile, isMobile } = useSidebar()

const localePrefix = computed(() => {
  return getLocalePrefixFromPath(route.path)
})

const withLocale = (path: string) => `${localePrefix.value}${path.startsWith('/') ? path : `/${path}`}`

const navItems = computed(() => ([
  { label: 'Dashboard', icon: LayoutDashboard, path: withLocale(`/trips/${tripId}`) },
  { label: 'Itinerario', icon: CalendarRange, path: withLocale(`/trips/${tripId}/itinerary`) },
  { label: 'Tareas', icon: ListTodo, path: withLocale(`/trips/${tripId}/tasks`) },
  { label: 'Vuelos', icon: Plane, path: withLocale(`/trips/${tripId}/flights`) },
  { label: 'Alojamiento', icon: BedDouble, path: withLocale(`/trips/${tripId}/accommodation`) },
  { label: 'Transporte', icon: Train, path: withLocale(`/trips/${tripId}/transport`) },
  { label: 'Actividades', icon: Ticket, path: withLocale(`/trips/${tripId}/activities`) },
  { label: 'Seguros', icon: Shield, path: withLocale(`/trips/${tripId}/insurance`) },
  { label: 'Viajeros', icon: Users, path: withLocale(`/trips/${tripId}/travelers`) },
  //{ label: 'Gastos y Cartera', icon: History, path: withLocale(`/trips/${tripId}/gastos`) },
  { label: 'Gastos Día', icon: Banknote, path: withLocale(`/trips/${tripId}/gastos-dia`) },
]))

const optionsPath = computed(() => withLocale(`/trips/${tripId}/options`))

const isActive = (path: string) => {
    if (path.endsWith(`/${tripId}`)) return route.path === path
    return route.path.startsWith(path)
}

const handleNavClick = () => {
  if (isMobile.value) {
    setOpenMobile(false)
  }
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="!p-6">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <AppLogo />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu class="!p-4">
            <SidebarMenuItem v-for="item in navItems" :key="item.path">
              <SidebarMenuButton :isActive="isActive(item.path)" as-child :tooltip="item.label">
                <NuxtLink :to="item.path" class="px-4 !py-5 block" @click="handleNavClick">
                  <component :is="item.icon" class="!size-5" />
                  <span class="text-base">{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="!p-6">
      <SidebarMenu>
        <SidebarMenuItem>
          <Drawer>
            <DrawerTrigger as-child>
              <SidebarMenuButton :isActive="isActive(optionsPath)" as-child :tooltip="'Opciones'">
                <div class="px-4 !py-5 flex items-center gap-2 cursor-pointer">
                  <Settings class="!size-5" />
                  <span class="text-base">Opciones</span>
                </div>
              </SidebarMenuButton>
            </DrawerTrigger>
            <SettingsContent />
          </Drawer>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
    
  </Sidebar>
</template>
