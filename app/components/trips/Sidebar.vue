<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Plane, BedDouble, Train, Ticket, Shield, Wallet, Users, CalendarRange, ListTodo, Settings, Banknote, Backpack } from 'lucide-vue-next'
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
import { useTripsNew } from '~/composables/useTripsNew'
import { getLocalePrefixFromPath } from '~/components/ui/sidebar/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

const route = useRoute()
const router = useRouter()
const tripId = route.params.id as string
const { t } = useI18n()
const tt = (key: string) => (t(key) as unknown as string) || ''

const { currentTrip } = useTripsNew()
const { setOpenMobile, isMobile, state } = useSidebar()
const showTooltips = computed(() => state.value === 'collapsed' && !isMobile.value)

const localePrefix = computed(() => {
  return getLocalePrefixFromPath(route.path)
})

const withLocale = (path: string) => `${localePrefix.value}${path.startsWith('/') ? path : `/${path}`}`

const parseTripDate = (raw: any): Date | null => {
  const s = String(raw || '').slice(0, 10)
  const parts = s.split('-').map((x) => Number(x))
  if (parts.length !== 3) return null
  const [y, m, d] = parts
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

const isTodayWithinTrip = computed(() => {
  const trip: any = currentTrip.value
  const start = parseTripDate(trip?.start_date)
  const end = parseTripDate(trip?.end_date)
  if (!start || !end) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today >= start && today <= end
})

const travelModePath = computed(() => withLocale(`/trips/${tripId}/gastos-dia`))

const navItems = computed(() => ([
  { label: tt('trip_sidebar.dashboard'), icon: LayoutDashboard, path: withLocale(`/trips/${tripId}`) },
  { label: tt('trip_sidebar.itinerary'), icon: CalendarRange, path: withLocale(`/trips/${tripId}/itinerary`) },
  { label: tt('trip_sidebar.tasks'), icon: ListTodo, path: withLocale(`/trips/${tripId}/tasks`) },
  { label: tt('trip_sidebar.flights'), icon: Plane, path: withLocale(`/trips/${tripId}/flights`) },
  { label: tt('trip_sidebar.accommodation'), icon: BedDouble, path: withLocale(`/trips/${tripId}/accommodation`) },
  { label: tt('trip_sidebar.transport'), icon: Train, path: withLocale(`/trips/${tripId}/transport`) },
  { label: tt('trip_sidebar.activities'), icon: Ticket, path: withLocale(`/trips/${tripId}/activities`) },
  { label: tt('trip_sidebar.insurance'), icon: Shield, path: withLocale(`/trips/${tripId}/insurance`) },
  { label: tt('trip_sidebar.travelers'), icon: Users, path: withLocale(`/trips/${tripId}/travelers`) },
  { label: tt('trip_sidebar.luggage'), icon: Backpack, path: withLocale(`/trips/${tripId}/suitcase`) },
  { label: tt('trip_sidebar.expenses'), icon: Banknote, path: withLocale(`/trips/${tripId}/gastos`) },
]))

const optionsPath = computed(() => withLocale(`/trips/${tripId}/options`))

const isActive = (path: string) => {
    // Exact match for dashboard to prevent highlighting on subpages
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
    <TooltipProvider>
      <SidebarHeader class="p-6 transition-[padding] duration-200 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child>
              <AppLogo :to="withLocale('/trips')" :compact="state === 'collapsed'" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu class="p-4 transition-[padding] duration-200 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:mt-4">

            <SidebarMenuItem v-if="isTodayWithinTrip">
              <Tooltip :disabled="!showTooltips">
                <TooltipTrigger as-child>
                  <SidebarMenuButton class="px-4 py-5 group-data-[collapsible=icon]:!p-2" :isActive="isActive(travelModePath)" as-child :tooltip="tt('trip_sidebar.daily_expenses')">
                    <NuxtLink :to="travelModePath" class="bg-red-400 text-white mb-6 transition-colors duration-300" @click="handleNavClick">
                      <Backpack class="!size-5" />
                      <span class="text-base whitespace-nowrap transition-all duration-200 origin-left group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-x-0 group-data-[collapsible=icon]:overflow-hidden">{{ tt('trip_sidebar.daily_expenses') }}</span>
                    </NuxtLink>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent v-if="showTooltips" side="left" align="center">
                  {{ tt('trip_sidebar.daily_expenses') }}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>


            <SidebarMenuItem v-for="item in navItems" :key="item.path">
              <Tooltip :disabled="!showTooltips">
                <TooltipTrigger as-child>
                  <SidebarMenuButton class="px-4 py-5 group-data-[collapsible=icon]:!p-2" :isActive="isActive(item.path)" as-child :tooltip="item.label">
                    <NuxtLink :to="item.path" class="transition-colors duration-300" @click="handleNavClick">
                      <component :is="item.icon" class="!size-5" />
                      <span class="text-base whitespace-nowrap transition-all duration-200 origin-left group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-x-0 group-data-[collapsible=icon]:overflow-hidden">{{ item.label }}</span>
                    </NuxtLink>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent v-if="showTooltips" side="left" align="center">
                  {{ item.label }}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="p-6 transition-[padding] duration-200 group-data-[collapsible=icon]:p-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <Drawer>
            <Tooltip :disabled="!showTooltips">
              <DrawerTrigger as-child>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    data-sidebar="menu-button"
                    :data-active="isActive(optionsPath)"
                    class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md px-4 py-5 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding,gap] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2"
                  >
                    <Settings class="!size-5" />
                    <span class="text-base whitespace-nowrap transition-all duration-200 origin-left group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:scale-x-0 group-data-[collapsible=icon]:overflow-hidden">{{ tt('trip_sidebar.options') }}</span>
                  </button>
                </TooltipTrigger>
              </DrawerTrigger>
              <TooltipContent v-if="showTooltips" side="left" align="center">
                {{ tt('trip_sidebar.options') }}
              </TooltipContent>
            </Tooltip>
            <SettingsContent />
          </Drawer>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
    
    </TooltipProvider>
  </Sidebar>
</template>
