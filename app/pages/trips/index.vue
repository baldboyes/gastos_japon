<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Plus, 
  MapPin, 
  Loader2, 
  Pencil, 
  Trash2,
  MoreVertical,
  Calendar as CalendarIcon,
  Upload
} from 'lucide-vue-next'

import { fileUrl } from '~/utils/directusFiles'
import { useDirectusFiles } from '~/composables/useDirectusFiles'
import SecureImage from '~/components/ui/SecureImage.vue'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import TripDrawer from '~/components/trips/modals/TripDrawer.vue'
import GroupTripsList from '~/components/trips/GroupTripsList.vue'
import UserAvatar from '~/components/common/UserAvatar.vue'
import { formatDateWithDayShort, formatDate } from '~/utils/dates'
import AppLogo from '~/components/common/AppLogo.vue'
import HeaderUserMenu from '~/components/layout/HeaderUserMenu.vue'

// Estado
const { trips, loading, error, fetchTrips, deleteTrip } = useTrips()

const upcomingTrips = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  return trips.value.filter((trip: any) => {
    if (!trip.fecha_fin) return true
    const endDate = new Date(trip.fecha_fin)
    return endDate >= now
  }).sort((a: any, b: any) => {
    // Ordenar por fecha_inicio ascendente (más cercanos a hoy primero)
    const dateA = new Date(a.fecha_inicio || 0).getTime()
    const dateB = new Date(b.fecha_inicio || 0).getTime()
    return dateA - dateB
  })
})

const pastTrips = computed(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  return trips.value.filter((trip: any) => {
    if (!trip.fecha_fin) return false
    const endDate = new Date(trip.fecha_fin)
    return endDate < now
  }).sort((a: any, b: any) => {
    // Ordenar por fecha_inicio descendente (más recientes primero)
    const dateA = new Date(a.fecha_inicio || 0).getTime()
    const dateB = new Date(b.fecha_inicio || 0).getTime()
    return dateB - dateA
  })
})

const isOpen = ref(false)
const tripToEdit = ref(null)
const isDeleteOpen = ref(false)
const tripToDelete = ref<string | null>(null)

// Cargar viajes al montar
onMounted(() => {
  fetchTrips()
})

// Handlers
const openCreateDialog = () => {
  tripToEdit.value = null
  isOpen.value = true
}

const openEditDialog = (trip: any) => {
  tripToEdit.value = trip
  isOpen.value = true
}

const handleDeleteClick = (id: string) => {
  tripToDelete.value = id
  isDeleteOpen.value = true
}

const executeDelete = async () => {
  if (tripToDelete.value) {
    await deleteTrip(tripToDelete.value)
    isDeleteOpen.value = false
    tripToDelete.value = null
  }
}

// Handler para errores de imagen
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-trip.webp'
}
</script>

<template>
  <NuxtLayout name="default">
    <header class="flex h-18 shrink-0 items-center gap-2 px-6 sticky top-0 z-10 mb-6">
      <AppLogo />
      <div class="ml-auto flex items-center gap-4">
        <HeaderUserMenu />
      </div>
    </header>
    <div class="max-w-4xl mx-auto p-4 space-y-6">
      <SignedIn>
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Mis Viajes</h1>
            <p class="text-muted-foreground">Gestiona tus aventuras y presupuestos.</p>
          </div>
          <Button @click="openCreateDialog">
            <Plus class="mr-2 h-4 w-4" /> Nuevo Viaje
          </Button>
        </div>

        <!-- Loading State -->
        <div v-if="loading && trips.length === 0" class="flex justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>

        <!-- Empty State -->
        <div v-else-if="trips.length === 0" class="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
          <MapPin class="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 class="mt-4 text-lg font-semibold">No hay viajes todavía</h3>
          <p class="text-muted-foreground mb-4">Empieza creando tu primer viaje para controlar los gastos.</p>
          <Button @click="openCreateDialog">Crear Viaje</Button>
        </div>

        <!-- Grid de Viajes -->
        <div v-else class="space-y-12">
          
          <!-- Próximos Viajes -->
          <div v-if="upcomingTrips.length > 0">
            <h2 class="text-2xl font-bold mb-4" v-if="pastTrips.length > 0">Próximos Viajes</h2>
            <div class="grid gap-6" :class="{'grid-cols-1': upcomingTrips.length === 1, 'grid-cols-2': upcomingTrips.length > 1}">
              <Card v-for="trip in upcomingTrips" :key="trip.id" class="hover:shadow-md transition-shadow overflow-hidden rounded-2xl border border-slate-200">
                <div class="aspect-video w-full overflow-hidden bg-muted relative -mt-6">
                  <img 
                    v-if="trip.portada" 
                    :src="fileUrl(trip.portada)" 
                    :alt="trip.nombre" 
                    class="w-full h-full object-cover transition-transform hover:scale-105 duration-500 hidden"
                  />
                  <SecureImage 
                    v-if="trip.portada" 
                    :src="trip.portada" 
                    :alt="trip.nombre" 
                    class="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                    @error="handleImageError" 
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/20 bg-muted/50">
                    <MapPin class="h-12 w-12" />
                  </div>
                  <div class="absolute top-4 right-4 bg-white/50 rounded-lg">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8 p-0">
                          <span class="sr-only">Abrir menú</span>
                          <MoreVertical class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="openEditDialog(trip)">
                          <Pencil class="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="handleDeleteClick(trip.id)" class="text-destructive focus:text-destructive">
                          <Trash2 class="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div class="absolute top-4 left-4 pl-1 pr-4 py-1 rounded-full bg-white/50">
                    <UserAvatar :user="trip.user_created" size="sm" :show-name="true" />
                  </div>
                  <div class="absolute bottom-4 left-4 flex -space-x-2">
                    <template v-if="trip.colaboradores && trip.colaboradores.length">
                      <UserAvatar 
                          v-for="collab in trip.colaboradores" 
                          :key="collab.directus_user_id?.id || collab.id" 
                          :user="collab.directus_user_id" 
                          size="sm"
                      />
                    </template>
                  </div>
                </div>
                <CardHeader class="">
                  <CardTitle class="text-xl">{{ trip.nombre }}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="flex items-center mb-3 -mt-8">
                    <CalendarIcon class="mr-1 h-3 w-3" />
                    del {{ formatDateWithDayShort(trip.fecha_inicio) }} al {{ formatDateWithDayShort(trip.fecha_fin) }}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button class="w-full" as-child>
                    <NuxtLink :to="`/trips/${trip.id}`">Ver Detalles</NuxtLink>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <!-- Viajes Anteriores -->
          <div v-if="pastTrips.length > 0">
            <h2 class="text-2xl font-bold mb-4">Viajes Anteriores</h2>
            <div class="grid gap-6 lg:grid-cols-2">
              <Card v-for="trip in pastTrips" :key="trip.id" class="hover:shadow-md transition-shadow overflow-hidden rounded-2xl border border-slate-200">
                <div class="aspect-video w-full overflow-hidden bg-muted relative -mt-6">
                  <img 
                    v-if="trip.portada" 
                    :src="fileUrl(trip.portada)" 
                    :alt="trip.nombre" 
                    class="w-full h-full object-cover transition-transform hover:scale-105 duration-500 hidden"
                  />
                  <SecureImage 
                    v-if="trip.portada" 
                    :src="trip.portada" 
                    :alt="trip.nombre" 
                    class="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                    @error="handleImageError" 
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground/20 bg-muted/50">
                    <MapPin class="h-12 w-12" />
                  </div>
                </div>
                <CardHeader class="pb-2">
                  <div class="flex justify-between items-start">
                    <CardTitle class="text-xl">{{ trip.nombre }}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8 p-0">
                          <span class="sr-only">Abrir menú</span>
                          <MoreVertical class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="openEditDialog(trip)">
                          <Pencil class="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="handleDeleteClick(trip.id)" class="text-destructive focus:text-destructive">
                          <Trash2 class="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div class="flex items-center mt-1">
                    <CalendarIcon class="mr-1 h-3 w-3" />
                    del {{ formatDateWithDayShort(trip.fecha_inicio) }} al {{ formatDateWithDayShort(trip.fecha_fin) }}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button class="w-full" as-child>
                    <NuxtLink :to="`/trips/${trip.id}`">Ver Detalles</NuxtLink>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

        </div>

        <TripDrawer 
          v-model:open="isOpen" 
          :trip-to-edit="tripToEdit" 
          @saved="fetchTrips" 
        />

        <!-- Alert Dialog Confirmación -->
        <AlertDialog v-model:open="isDeleteOpen">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el viaje y todos los datos asociados (vuelos, alojamientos, gastos, etc.).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">Eliminar Viaje</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </SignedIn>

      <!-- Viajes en Grupo - Componente autónomo -->
      <GroupTripsList />

    </div>
  </NuxtLayout>
</template>