<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { BedDouble, Plus, Trash2, Pencil, Calendar, MapPin, MoreVertical, PhoneCall, Mail, BaggageClaim, Bath, Coffee, Utensils, BedSingle } from 'lucide-vue-next'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { formatDateTime, formatDate, getDaysElapsed, formatDateWithDayShort, formatTime } from '~/utils/dates'
import { formatCurrency } from '~/utils/currency'
import { cn } from '~/lib/utils'
import { getStatusColor, getStatusLabel } from '~/utils/trip-status'
import { Button } from '~/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import AccommodationModal from '~/components/trips/modals/AccommodationModal.vue'
import LocationMap from '~/components/maps/LocationMap.vue'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
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
import UserAvatar from '~/components/common/UserAvatar.vue'
import { useTripTasks } from '~/composables/useTripTasks'
import TaskModal from '~/components/trips/tasks/TaskModal.vue'
import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'
import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
import { type Task } from '~/types/tasks'

const route = useRoute()
const tripId = route.params.id as string

const { currentTrip } = useTrips()
const { alojamientos, fetchOrganizationData, deleteAlojamiento } = useTripOrganization()
const { tasks, init: initTasks, updateTask } = useTripTasks()

const isTaskModalOpen = ref(false)
const selectedTaskToEdit = ref<Task | null>(null)

const allAccommodationTasks = computed(() => {
  return tasks.value.filter(t => {
    // Check direct entity type
    if (t.entity_type === 'accommodation') return true
    
    // Check group entity type if task doesn't have it set directly
    const group = typeof t.task_group === 'object' ? t.task_group : null
    if (group && group.entity_type === 'accommodation') return true
    
    return false
  })
})

const handleEditTask = (task: Task) => {
  selectedTaskToEdit.value = task
  isTaskModalOpen.value = true
}

const isModalOpen = ref(false)
const itemToEdit = ref(null)

const isDeleteOpen = ref(false)
const accommodationToDelete = ref<number | null>(null)

const confirmDelete = (id: number) => {
  accommodationToDelete.value = id
  isDeleteOpen.value = true
}

const executeDelete = async () => {
  if (accommodationToDelete.value) {
    await deleteAlojamiento(accommodationToDelete.value)
    isDeleteOpen.value = false
    accommodationToDelete.value = null
  }
}

const handleCreateAccommodation = () => {
  itemToEdit.value = null
  isModalOpen.value = true
}

const handleEditAccommodation = (a: any) => {
  itemToEdit.value = a
  isModalOpen.value = true
}

const onSaved = () => {
  fetchOrganizationData(tripId)
}

onMounted(() => {
  fetchOrganizationData(tripId)
  initTasks(parseInt(tripId))
})

const getNights = (start: string, end: string) => {
  if (!start || !end) return 0
  const d1 = new Date(start)
  const d2 = new Date(end)
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row gap-8 items-start relative">
        
        <!-- Main Content -->
        <div class="flex-1 w-full space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-1">
                <BedDouble class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">Alojamiento</h2>
                <p class="text-muted-foreground hidden md:block">Gestiona tus reservas de hoteles y apartamentos.</p>
              </div>
            </div>
            <Button @click="handleCreateAccommodation"><Plus class="h-4 w-4" /> Añadir</Button>
          </div>
          <div v-if="alojamientos.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <BedDouble class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">No hay alojamientos registrados</h3>
            <p class="max-w-md mx-auto mt-2">Añade tus reservas para organizar dónde dormirás.</p>
          </div>
          <template v-else>
            <Card v-for="a in alojamientos" :key="a.id">
              <CardHeader class="flex flex-row items-start justify-between gap-4">
                <div class="flex justify-between w-full">
                  <CardTitle class="text-lg">{{ a.nombre }}</CardTitle>
                  <div class="flex items-center gap-2">
                    <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getStatusColor(a.estado_pago || 'pendiente'))">
                      {{ formatCurrency(a.precio || 0, a.moneda) }}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8 p-0">
                      <span class="sr-only">Abrir menú</span>
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleEditAccommodation(a)">
                      <Pencil class="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="confirmDelete(a.id)" class="text-destructive focus:text-destructive">
                      <Trash2 class="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div class="flex flex-col xl:flex-row gap-8 w-full">
                  <div class="w-full xl:w-1/2">
                    <div v-if="a.ubicacion?.latitude && a.ubicacion?.longitude" class="h-[200px] w-full rounded-md overflow-hidden relative">
                      <LocationMap 
                        :latitude="a.ubicacion.latitude" 
                        :longitude="a.ubicacion.longitude"
                      />
                    </div>
                  </div>
                  <div class="w-full xl:w-1/2 flex flex-col justify-between space-y-6">
                    <div class="flex justify-between gap-4">
                      <div class="space-y-1">
                        <div class="text-xs font-bold text-slate-500 uppercase">Entrada</div>
                        <div class="flex items-center gap-2">
                          <span class="font-medium">{{ formatDateWithDayShort(a.fecha_entrada) }}</span>
                          <Badge variant="outline" class="font-mono text-xs">{{ formatTime(a.fecha_entrada) }}</Badge>
                        </div>
                      </div>
                      <div class="space-y-1">
                        <div class="text-xs font-bold text-slate-500 uppercase">Salida</div>
                        <div class="flex items-center gap-2">
                          <span class="font-medium">{{ formatDateWithDayShort(a.fecha_salida) }}</span>
                          <Badge variant="outline" class="font-mono text-xs">{{ formatTime(a.fecha_salida) }}</Badge>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <BedSingle class="h-4 w-4 text-slate-400" />
                      <span>1 habitación individual</span>
                    </div>
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center justify-start gap-1">
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.ubicacion?.address">
                          <NuxtLink :href="a.enlace_google" target="_blank"> 
                            <span class="sr-only">Ir a Google Maps</span>
                            <MapPin class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.telefono">
                          <NuxtLink v-if="a.telefono" :title="`Llamar: ${a.telefono}`" :href="`tel:${a.telefono}`"> 
                            <span class="sr-only">Llamar</span>
                            <PhoneCall class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.email">
                          <NuxtLink v-if="a.email" :title="`Enviar correo: ${a.email}`" :href="`mailto:${a.email}`"> 
                            <span class="sr-only">Enviar correo</span>
                            <Mail class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                      </div>
                      <div class="flex items-center justify-end gap-2">
                        <TooltipProvider v-if="a.takkyubin">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <div class="p-2">
                                <BaggageClaim class="h-5 w-5 text-gray-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Traslado de maletas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider v-if="a.privado">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <div class="p-2">
                                <Bath class="h-5 w-5 text-gray-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Baño privado</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider v-if="a.pension?.includes('desayuno') || a.pension?.includes('comida') || a.pension?.includes('cena') || a.pension?.includes('completa')">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <div class="p-2 flex items-center gap-6">
                                <Coffee v-if="a.pension?.includes('desayuno')" class="h-5 w-5 text-gray-500" />
                                <Utensils v-if="a.pension?.includes('comida') || a.pension?.includes('cena') || a.pension?.includes('completa')" class="h-5 w-5 text-gray-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p class="flex gap-2">
                                <span v-if="a.pension?.includes('desayuno')">Desayuno</span>
                                <span v-if="a.pension?.includes('comida')">Comida</span>
                                <span v-if="a.pension?.includes('cena')">Cena</span>
                                <span v-if="a.pension?.includes('completa')">Completa</span>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="a.notas" class="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm text-slate-600">
                  <p class="font-medium text-yellow-700 text-xs uppercase mb-1">Notas</p>
                  <p class="whitespace-pre-line">{{ a.notas }}</p>
                </div>
                <EntityTasksWidget 
                  :trip-id="parseInt(tripId)"
                  entity-type="accommodation"
                  :entity-id="a.id"
                  :title="`Tareas: ${a.nombre || 'Alojamiento'}`"
                  class="hidden"
                />
              </CardContent>
            </Card>
          </template>
        </div>

        <!-- Sidebar Tasks -->
        <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
          <TasksSidebar 
            :tasks="allAccommodationTasks"
            @update:status="(id, status) => updateTask(id, { status })"
            @edit="handleEditTask"
          />
          <div class="bg-gray-200/75 rounded-2xl overflow-hidden mt-4 h-[170px] w-full flex items-center justify-center">
            ANUNCIO
          </div>
        </div>

      </div>
    </div>

    <AccommodationModal 
      v-model:open="isModalOpen" 
      :trip-id="tripId" 
      :current-trip="currentTrip" 
      :item-to-edit="itemToEdit" 
      @saved="onSaved"
    />

    <TaskModal 
      v-model:open="isTaskModalOpen" 
      :task="selectedTaskToEdit" 
      :trip-id="parseInt(tripId)"
      @saved="initTasks(parseInt(tripId))"
    />

    <!-- Alert Dialog Confirmación -->
    <AlertDialog v-model:open="isDeleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el alojamiento y todos sus datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">Eliminar Alojamiento</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </NuxtLayout>
</template>
