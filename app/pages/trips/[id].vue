<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Calendar as CalendarIcon, 
  LayoutDashboard, Plane, Hotel, Train, Ticket, Shield, Wallet, Users, CalendarRange
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { useTrips } from '~/composables/useTrips'

const route = useRoute()
const router = useRouter()
const tripId = route.params.id as string

const { getTrip, currentTrip, loading } = useTrips()

// Cargar viaje si no está
if (!currentTrip.value) {
  getTrip(tripId)
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: `/trips/${tripId}` },
  { label: 'Itinerario', icon: CalendarRange, path: `/trips/${tripId}/itinerary` },
  { label: 'Vuelos', icon: Plane, path: `/trips/${tripId}/flights` },
  { label: 'Alojamiento', icon: Hotel, path: `/trips/${tripId}/accommodation` },
  { label: 'Transporte', icon: Train, path: `/trips/${tripId}/transport` },
  { label: 'Actividades', icon: Ticket, path: `/trips/${tripId}/activities` },
  { label: 'Seguros', icon: Shield, path: `/trips/${tripId}/insurance` },
  { label: 'Viajeros', icon: Users, path: `/trips/${tripId}/travelers` },
  { label: 'Finanzas', icon: Wallet, path: `/trips/${tripId}/wallet` },
]

const isActive = (path: string) => {
    if (path.endsWith(`/${tripId}`)) return route.path === path
    return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r hidden md:flex flex-col fixed inset-y-0 z-50">
      <div class="p-6 border-b" style="background-image: url('https://api.mevoyajapon.com/assets/${currentTrip?.portada}?width=800&format=webp'); background-size: cover; background-position: center;">
        <Button variant="ghost" class="w-full justify-start pl-0 -ml-2 mb-4" @click="router.push('/trips')">
          <ArrowLeft class="mr-2 h-4 w-4" /> Volver
        </Button>
        <div v-if="loading" class="h-6 w-32 bg-slate-100 animate-pulse rounded"></div>
        <div v-else>
            <h1 class="font-bold text-lg truncate" :title="currentTrip?.nombre">{{ currentTrip?.nombre }}</h1>
            <div class="flex items-center text-xs text-muted-foreground mt-1">
                <CalendarIcon class="mr-1 h-3 w-3" />
                <span>
                  {{ currentTrip?.fecha_inicio ? new Date(currentTrip.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '' }} 
                  - 
                  {{ currentTrip?.fecha_fin ? new Date(currentTrip.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '' }}
                </span>
            </div>
        </div>
      </div>
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <NuxtLink 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
        >
            <component :is="item.icon" class="mr-3 h-4 w-4" />
            {{ item.label }}
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-64">
        <!-- Mobile Header -->
        <header class="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-40">
             <Button variant="ghost" size="icon" @click="router.push('/trips')"><ArrowLeft class="h-5 w-5" /></Button>
             <span class="font-bold truncate">{{ currentTrip?.nombre }}</span>
             <!-- Simple Mobile Nav Link -->
             <NuxtLink :to="`/trips/${tripId}`"><LayoutDashboard class="h-5 w-5" /></NuxtLink>
        </header>

        <div class="flex-1 overflow-auto p-4 md:p-8">
            <NuxtPage />
        </div>
    </main>
  </div>
</template>
