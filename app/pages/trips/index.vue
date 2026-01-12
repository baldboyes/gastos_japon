<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { getLocalTimeZone, today, parseDate } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { DateFormatter } from '@internationalized/date'
import { 
  Plus, 
  MapPin, 
  Loader2, 
  Edit2, 
  Trash2, 
  Calendar as CalendarIcon 
} from 'lucide-vue-next'
import { fileUrl } from '~/utils/directusFiles'
import GroupTripsList from '~/components/trips/GroupTripsList.vue'

// Estado
const { trips, loading, error, fetchTrips, createTrip, updateTrip, deleteTrip } = useTrips()
const isOpen = ref(false)
const isEditing = ref(false)
const currentId = ref<string | null>(null)
const isDeleteOpen = ref(false)
const tripToDelete = ref<string | null>(null)

const { user } = useUser()

// Formulario
const formData = ref({
  nombre: '',
})
// Rango de fechas para el calendario
const dateRange = ref({
  start: today(getLocalTimeZone()),
  end: today(getLocalTimeZone()).add({ days: 7 }),
}) as Ref<DateRange>

const df = new DateFormatter('es-ES', {
  dateStyle: 'medium'
} as any)

// Cargar viajes al montar
onMounted(() => {
  fetchTrips()
})




// Handlers
const openCreateDialog = () => {
  isEditing.value = false
  currentId.value = null
  formData.value.nombre = ''
  dateRange.value = {
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ days: 7 }),
  }
  isOpen.value = true
}

const openEditDialog = (trip: any) => {
  isEditing.value = true
  currentId.value = trip.id
  formData.value.nombre = trip.nombre
  
  try {
    // Parsear strings YYYY-MM-DD a CalendarDate
    // Directus devuelve YYYY-MM-DD, que parseDate acepta directamente
    if (trip.fecha_inicio) {
      const start = parseDate(trip.fecha_inicio)
      const end = trip.fecha_fin ? parseDate(trip.fecha_fin) : start
      
      dateRange.value = {
        start: start,
        end: end
      }
    } else {
        // Fallback
        dateRange.value = {
            start: today(getLocalTimeZone()),
            end: today(getLocalTimeZone()).add({ days: 7 }),
        }
    }
  } catch (e) {
    console.error("Error parsing dates for calendar:", e)
    // Fallback en caso de error
    dateRange.value = {
        start: today(getLocalTimeZone()),
        end: today(getLocalTimeZone()).add({ days: 7 }),
    }
  }
  
  isOpen.value = true
}

const handleSubmit = async () => {
  if (!formData.value.nombre || !dateRange.value.start) return

  const tripData = {
    nombre: formData.value.nombre,
    fecha_inicio: dateRange.value.start.toString(),
    fecha_fin: dateRange.value.end?.toString() || dateRange.value.start.toString(),
    portada: null,
  }

  try {
    if (isEditing.value && currentId.value) {
      await updateTrip(currentId.value, tripData)
    } else {
      await createTrip(tripData)
    }
    isOpen.value = false
  } catch (e) {
    // Error manejado en el composable
  }
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

// Utils
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return ''
  // Para mostrar en la tarjeta, usamos Date nativo que es más tolerante
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

</script>

<template>
  <NuxtLayout name="default">
    <div class="w-full space-y-16">
      <div class="max-w-4xl mx-auto p-4 space-y-6">
        <SignedIn>
          <div class="flex items-center justify-between pt-8">
            <div class="flex items-center gap-3">
                <div v-if="user?.imageUrl" class="w-10 h-10 rounded-full overflow-hidden">
                  <img :src="user.imageUrl" alt="Perfil" class="w-full h-full object-cover" />
                </div>
                <div class="text-sm text-slate-500">
                  {{ user?.firstName || 'Usuario' }} {{ user?.lastName || '' }}<br />
                  <pre>{{ user?.emailAddresses?.[0]?.emailAddress || 'No email' }}</pre>
                </div>
            </div>
          </div>
        

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
            <Button @click="openCreateDialog" variant="outline">Crear Viaje</Button>
          </div>

          <!-- Grid de Viajes -->
          <div v-else class="grid gap-6 md:grid-cols-2">
            <Card v-for="trip in trips" :key="trip.id" class="hover:shadow-md transition-shadow">
              <!-- Imagen -->
              <div class="w-full md:w-48 h-48 relative shrink-0">
                <img v-if="trip.portada"
                  :src="`https://api.mevoyajapon.com/assets/${trip.portada}?width=1200&format=webp`" 
                  :alt="trip.nombre"
                  class="w-full h-full object-cover"
                />
                <img v-else src="/placeholder-trip.webp" alt="Placeholder" class="w-full h-full object-cover" />
              </div>

              <CardHeader class="pb-2">
                <div class="flex justify-between items-start">
                  <CardTitle class="text-xl">{{ trip.nombre }}</CardTitle>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click="openEditDialog(trip)">
                      <Edit2 class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="handleDeleteClick(trip.id)">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription class="flex items-center mt-1">
                  <CalendarIcon class="mr-1 h-3 w-3" />
                  {{ formatDate(trip.fecha_inicio) }} - {{ formatDate(trip.fecha_fin) }}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="text-sm text-muted-foreground">
                  <!-- Aquí podríamos poner resumen de gastos futuros -->
                  Planificado
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" class="w-full" as-child>
                  <NuxtLink :to="`/trips/${trip.id}`">Ver Detalles</NuxtLink>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <!-- Dialogo Crear/Editar -->
          <Dialog v-model:open="isOpen">
            <DialogContent class="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{{ isEditing ? 'Editar Viaje' : 'Crear Nuevo Viaje' }}</DialogTitle>
                <DialogDescription>
                  Define el nombre y las fechas de tu viaje.
                </DialogDescription>
              </DialogHeader>
              
              <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                  <Label htmlFor="name">Nombre del Viaje</Label>
                  <Input id="name" v-model="formData.nombre" placeholder="Ej: Japón 2026" />
                </div>
                
                <div class="grid gap-2">
                  <Label>Fechas</Label>
                  <div class="border rounded-md p-4 flex justify-center bg-background">
                    <RangeCalendar v-model="dateRange" class="rounded-md border" />
                  </div>
                  <p class="text-xs text-muted-foreground text-center">
                    Selecciona el día de inicio y el día de fin.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" @click="handleSubmit" :disabled="loading">
                  {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Viaje') }}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
      </div>
      <!-- Viajes en Grupo - Componente autónomo -->
      <GroupTripsList />

    </div>
  </NuxtLayout>
</template>