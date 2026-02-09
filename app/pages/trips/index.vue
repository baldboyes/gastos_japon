<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { getLocalTimeZone, today, parseDate } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { DateFormatter } from '@internationalized/date'
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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { RangeCalendar } from '~/components/ui/range-calendar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
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
import GroupTripsList from '~/components/trips/GroupTripsList.vue'
import UserAvatar from '~/components/common/UserAvatar.vue'
import { formatDateWithDayShort, formatDate } from '~/utils/dates'

// Estado
const { trips, loading, error, fetchTrips, createTrip, updateTrip, deleteTrip } = useTrips()

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
const isEditing = ref(false)
const currentId = ref<string | null>(null)
const isDeleteOpen = ref(false)
const tripToDelete = ref<string | null>(null)

const { user } = useUser()

const { uploadFile } = useDirectusFiles()
const uploadingCover = ref(false)

const handleCoverUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  if (!file) return

  // Validación básica 10MB
  if (file.size > 10 * 1024 * 1024) {
    console.error('La imagen supera los 10MB')
    return
  }

  uploadingCover.value = true
  try {
    const fileId = await uploadFile(file)
    formData.value.portada = fileId
  } catch (e) {
    console.error('Error uploading cover:', e)
  } finally {
    uploadingCover.value = false
    input.value = ''
  }
}

// Formulario
const formData = ref<{
  nombre: string
  portada: string | null
  presupuesto_diario: number | undefined
  moneda: string
}>({
  nombre: '',
  portada: null,
  presupuesto_diario: undefined,
  moneda: 'JPY',
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
  formData.value.portada = null
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
  formData.value.portada = trip.portada
  formData.value.presupuesto_diario = trip.presupuesto_diario
  formData.value.moneda = trip.moneda
  
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
    portada: formData.value.portada,
    presupuesto_diario: formData.value.presupuesto_diario,
    moneda: formData.value.moneda,
    fecha_inicio: dateRange.value.start.toString(),
    fecha_fin: dateRange.value.end?.toString() || dateRange.value.start.toString()
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

// Handler para errores de imagen
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-trip.webp'
}
</script>

<template>
  <NuxtLayout name="default">
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
                <CardHeader class="pb-2">
                  <CardTitle class="text-xl">{{ trip.nombre }}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="flex items-center mt-1 mb-3">
                    <CalendarIcon class="mr-1 h-3 w-3" />
                    {{ formatDateWithDayShort(trip.fecha_inicio) }} - {{ formatDateWithDayShort(trip.fecha_fin) }}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary" class="w-full" as-child>
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
                    <div class="flex gap-1">
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div class="flex items-center mt-1">
                    <CalendarIcon class="mr-1 h-3 w-3" />
                    {{ formatDate(trip.fecha_inicio) }} - {{ formatDate(trip.fecha_fin) }}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="secondary" class="w-full" as-child>
                    <NuxtLink :to="`/trips/${trip.id}`">Ver Detalles</NuxtLink>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

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
              <div class="grid grid-cols-3 gap-2">
                <div class="col-span-2 w-full">
                  <Label htmlFor="presupuesto">Presupuesto diario</Label>
                  <Input id="presupuesto" v-model="formData.presupuesto_diario" type="number" placeholder="Ej: 10000" />
                </div>
                <div class="col-span-1 w-full">
                  <Label htmlFor="moneda">Moneda</Label>
                  <Select v-model="formData.moneda" placeholder="Selecciona la moneda">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JPY">&yen; Yen</SelectItem>
                        <SelectItem value="EUR">&euro; Euro</SelectItem>
                        <SelectItem value="USD">&dollar; Dolar</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
              </div>
              <!-- Subir portada -->
              <div class="grid gap-2">
                <Label>Portada</Label>
                <div v-if="formData.portada" class="relative aspect-video rounded-md overflow-hidden border group">
                  <SecureImage :src="formData.portada" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      @click="formData.portada = null"
                    >
                      <Trash2 class="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
                <div v-else class="flex items-center justify-center w-full">
                  <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                      <Loader2 v-if="uploadingCover" class="h-8 w-8 text-muted-foreground animate-spin" />
                      <template v-else>
                          <Upload class="w-8 h-8 mb-2 text-muted-foreground" />
                          <p class="text-sm text-muted-foreground font-medium">Click para subir portada</p>
                          <p class="text-xs text-muted-foreground">PNG, JPG (Max. 10MB)</p>
                      </template>
                    </div>
                    <input type="file" class="hidden" accept="image/png, image/jpeg, image/jpg" @change="handleCoverUpload" :disabled="uploadingCover" />
                  </label>
                </div>
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

      <!-- Viajes en Grupo - Componente autónomo -->
      <GroupTripsList />

    </div>
  </NuxtLayout>
</template>