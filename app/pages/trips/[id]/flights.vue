<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Plane, Plus, Trash2, Pencil, ArrowRight, Calendar, MoreVertical } from 'lucide-vue-next'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { useAirlines } from '~/composables/useAirlines'
import { formatTime } from '~/utils/dates'
import { formatCurrency } from '~/utils/currency'
import { groupByDate } from '~/utils/grouping'
import { cn } from '~/lib/utils'
import { getStatusColor, getStatusLabel } from '~/utils/trip-status'
import FlightModal from '~/components/trips/modals/FlightModal.vue'
import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'
import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
import TaskModal from '~/components/trips/tasks/TaskModal.vue'
import { useTripTasks } from '~/composables/useTripTasks'
import { type Task } from '~/types/tasks'
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

const route = useRoute()
const tripId = route.params.id as string

const { currentTrip } = useTrips()
const { vuelos, fetchOrganizationData, deleteVuelo } = useTripOrganization()
const { airlines, fetchAirlines } = useAirlines()
const { tasks, init: initTasks, updateTask } = useTripTasks()

const isTaskModalOpen = ref(false)
const selectedTaskToEdit = ref<Task | null>(null)

const allFlightTasks = computed(() => {
  return tasks.value.filter(t => {
    // Check direct entity type
    if (t.entity_type === 'flight') return true
    
    // Check group entity type if task doesn't have it set directly
    const group = typeof t.task_group === 'object' ? t.task_group : null
    if (group && group.entity_type === 'flight') return true
    
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
const flightToDelete = ref<number | null>(null)

const confirmDelete = (id: number) => {
  flightToDelete.value = id
  isDeleteOpen.value = true
}

const executeDelete = async () => {
  if (flightToDelete.value) {
    await deleteVuelo(flightToDelete.value)
    isDeleteOpen.value = false
    flightToDelete.value = null
  }
}

const handleCreateFlight = () => {
  itemToEdit.value = null
  isModalOpen.value = true
}

const handleEditFlight = (v: any) => {
  itemToEdit.value = v
  isModalOpen.value = true
}

const onSaved = () => {
  fetchOrganizationData(tripId)
}

onMounted(() => {
  fetchOrganizationData(tripId)
  fetchAirlines()
  initTasks(parseInt(tripId))
})

const getAirlineLogo = (name: string) => {
  if (!name) return null
  const airline = airlines.value.find(a => a.name === name)
  return airline?.logo || null
}

const getEscalasGrouped = (escalas?: any[]) => groupByDate(escalas, 'fecha_salida')

const getDayDiff = (start?: string, end?: string) => {
  if (!start || !end) return null
  const d1 = new Date(start); d1.setHours(0,0,0,0)
  const d2 = new Date(end); d2.setHours(0,0,0,0)
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? `+${diff}` : null
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
                <Plane class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">Vuelos</h2>
                <p class="text-muted-foreground hidden md:block">Gestiona tus billetes aéreos y reservas.</p>
              </div>
            </div>
            <Button @click="handleCreateFlight"><Plus class="h-4 w-4" /> Añadir</Button>
          </div>

          <div v-if="vuelos.length === 0" class=" px-4 md:px-0 text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <Plane class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">No hay vuelos registrados</h3>
            <p class="max-w-md mx-auto mt-2">Añade tus vuelos para organizar el itinerario de viaje.</p>
          </div>

          <div v-else class="space-y-4">
            <Card v-for="v in vuelos" :key="v.id">
              <CardHeader class="flex flex-row items-start justify-between gap-4">
                <div class="flex justify-between w-full">
                  <CardTitle class="text-lg">
                    <span>{{ v.titulo }}</span>
                    <span v-if="v.codigo_reserva" class="opacity-80 text-sm ml-2">{{ v.codigo_reserva }}</span>
                  </CardTitle>
                  <div class="flex items-center gap-2">
                    <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getStatusColor(v.estado_pago || 'pendiente'))">
                      {{ formatCurrency(v.precio || 0, v.moneda) }}
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
                    <DropdownMenuItem @click="handleEditFlight(v)">
                      <Pencil class="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="confirmDelete(v.id)" class="text-destructive focus:text-destructive">
                      <Trash2 class="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div class="w-full">
                  <!-- Escalas Display -->
                  <div v-if="v.escalas && v.escalas.length > 0" class="mt-4">
                    <div v-for="(group, gIndex) in getEscalasGrouped(v.escalas)" :key="gIndex" class="mb-4 last:mb-0">
                      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1 flex items-center gap-2">
                          <Calendar class="h-3 w-3" /> {{ group.date }}
                      </h4>
                      <div class="md:space-y-3">
                          <Card v-for="(escala, i) in group.items" :key="i" class="bg-slate-50/50">
                            <CardContent class="md:px-6 flex items-center justify-between">
                              <div class="flex items-center gap-2 md:gap-4">
                                <!-- Logo Aerolínea -->
                                <div class="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-md border border-gray-200 p-1">
                                  <img 
                                    v-if="getAirlineLogo(escala.aerolinea)" 
                                    :src="getAirlineLogo(escala.aerolinea)" 
                                    class="h-full w-full object-contain"
                                    alt=""
                                  />
                                  <Plane v-else class="h-8 w-8 text-slate-400" />
                                </div>
                                
                                <!-- Detalles Trayecto -->
                                <div>
                                  <div class="flex items-center gap-2 font-bold text-base text-slate-800">
                                    <Badge variant="outline" class="font-mono text-xs">{{ formatTime(escala.fecha_salida) }}</Badge>
                                    <span>{{ escala.origen }}</span> <span v-if="escala.terminal_origen" class="opacity-50 text-xs">{{ escala.terminal_origen }}</span>
                                    <ArrowRight class="h-4 w-4 text-muted-foreground mx-1" />
                                    <span v-if="escala.terminal_destino" class="opacity-50 text-xs">{{ escala.terminal_destino }}</span> <span>{{ escala.destino }}</span>
                                    <Badge variant="outline" class="font-mono text-xs">{{ formatTime(escala.fecha_llegada) }}</Badge>
                                      <sup v-if="getDayDiff(escala.fecha_salida, escala.fecha_llegada)" class="text-xs text-red-500 font-bold ml-0.5">{{ getDayDiff(escala.fecha_salida, escala.fecha_llegada) }}</sup>
                                  </div>
                                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                    <div v-if="escala.aerolinea" class="font-medium text-slate-700">
                                      {{ escala.aerolinea }}
                                    </div>
                                    <div v-if="escala.numero_vuelo" class="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">
                                      {{ escala.numero_vuelo }}
                                    </div>
                                  </div>
                                  <div v-if="escala.notas" class="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm text-slate-600">
                                    <p class="font-medium text-yellow-700 text-xs uppercase mb-1">Notas</p>
                                    <p class="whitespace-pre-line">{{ escala.notas }}</p>
                                  </div>
                                </div>
                              </div>

                            </CardContent>
                          </Card>
                      </div>
                    </div>
                  </div>

                  <EntityTasksWidget 
                    :trip-id="parseInt(tripId)"
                    entity-type="flight"
                    :entity-id="v.id"
                    :title="`Tareas: ${v.titulo || 'Vuelo'}`"
                    class="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Sidebar Tasks -->
        <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
          <TasksSidebar 
            :tasks="allFlightTasks"
            @update:status="(id, status) => updateTask(id, { status })"
            @edit="handleEditTask"
          />
          <div class="bg-gray-200/75 rounded-2xl overflow-hidden mt-4 h-[160px] w-full flex items-center justify-center">
            ANUNCIO
          </div>
        </div>
      </div>

      <FlightModal 
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el vuelo y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">Eliminar Vuelo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </NuxtLayout>
</template>