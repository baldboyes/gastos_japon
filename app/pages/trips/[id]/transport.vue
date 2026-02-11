<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Train, Plus, Trash2, Pencil, Calendar, ArrowRight, Bus, Ship, Car, MoreVertical } from 'lucide-vue-next'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { formatDateTime, formatTime, formatDate, formatDateWithDayShort } from '~/utils/dates'
import { formatCurrency } from '~/utils/currency'
import { cn } from '~/lib/utils'
import { getStatusColor, getStatusLabel } from '~/utils/trip-status'
import TransportDrawer from '~/components/trips/modals/TransportDrawer.vue'
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
const { transportes, fetchOrganizationData, deleteTransporte } = useTripOrganization()
const { tasks, init: initTasks, updateTask } = useTripTasks()

const isTaskModalOpen = ref(false)
const selectedTaskToEdit = ref<Task | null>(null)

const allTransportTasks = computed(() => {
  return tasks.value.filter(t => {
    // Check direct entity type
    if (t.entity_type === 'transport') return true
    
    // Check group entity type if task doesn't have it set directly
    const group = typeof t.task_group === 'object' ? t.task_group : null
    if (group && group.entity_type === 'transport') return true
    
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
const transportToDelete = ref<number | null>(null)

const confirmDelete = (id: number) => {
  transportToDelete.value = id
  isDeleteOpen.value = true
}

const executeDelete = async () => {
  if (transportToDelete.value) {
    await deleteTransporte(transportToDelete.value)
    isDeleteOpen.value = false
    transportToDelete.value = null
  }
}

const handleCreateTransport = () => {
  itemToEdit.value = null
  isModalOpen.value = true
}

const handleEditTransport = (t: any) => {
  itemToEdit.value = t
  isModalOpen.value = true
}

const onSaved = () => {
  fetchOrganizationData(tripId)
}

onMounted(() => {
  fetchOrganizationData(tripId)
  initTasks(parseInt(tripId))
})

const getTransportIcon = (type: string) => {
  switch (type) {
    case 'bus': return Bus
    case 'barco': return Ship
    case 'taxi': return Car
    default: return Train
  }
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
              <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1">
                <Train class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">Transporte</h2>
                <p class="text-muted-foreground hidden md:block">Trenes, pases y traslados internos.</p>
              </div>
            </div>
            <Button @click="handleCreateTransport"><Plus class="h-4 w-4" /> Añadir</Button>
          </div>





          <div v-if="transportes.length === 0" class=" px-4 md:px-0 text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <Train class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">No hay transportes registrados</h3>
            <p class="max-w-md mx-auto mt-2">Añade tus desplazamientos internos.</p>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <template v-for="t in transportes" :key="t.id">
                <Card v-if="t.categoria === 'pase'">
                  <CardHeader class="flex flex-row items-start justify-between gap-4">
                    <CardTitle class="text-lg">{{ t.nombre }}</CardTitle>   
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8 p-0">
                          <span class="sr-only">Abrir menú</span>
                          <MoreVertical class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="handleEditTransport(t)">
                          <Pencil class="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="confirmDelete(t.id)" class="text-destructive focus:text-destructive">
                          <Trash2 class="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div class="flex items-start gap-2">
                      <p class="text-xs font-medium">
                        {{ t.tipo_duracion === 'horas' ? formatDateTime(t.fecha_inicio) : formatDate(t.fecha_inicio) }} 
                        <br /> 
                        {{ t.tipo_duracion === 'horas' ? formatDateTime(t.fecha_fin) : formatDate(t.fecha_fin) }}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter class="flex justify-end">
                    <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getStatusColor(t.estado_pago || 'pendiente'))">
                      {{ formatCurrency(t.precio || 0, t.moneda) }}
                    </span>
                  </CardFooter>
                </Card>
              </template>
            </div>
            <template v-for="t in transportes" :key="t.id">
              <Card v-if="t.categoria === 'trayecto'">
                <CardHeader class="flex flex-row items-start justify-between gap-4">
                  <div class="flex justify-between w-full">
                    <CardTitle class="text-lg">
                      <div class="flex items-center gap-2 font-bold text-lg mt-1">
                        <span>{{ t.origen || 'Origen' }}</span>
                        <ArrowRight class="h-4 w-4 text-muted-foreground" />
                        <span>{{ t.destino || 'Destino' }}</span>
                      </div>
                    </CardTitle>
                    <div class="flex items-center gap-2">
                      <div v-if="t.pase_titulo" class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 mr-2">
                        <span class="font-bold">PASE</span>
                      </div>
                      <span v-else :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getStatusColor(t.estado_pago || 'pendiente'))">
                        {{ formatCurrency(t.precio || 0, t.moneda) }}
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
                      <DropdownMenuItem @click="handleEditTransport(t)">
                        <Pencil class="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="confirmDelete(t.id)" class="text-destructive focus:text-destructive">
                        <Trash2 class="mr-2 h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>



                <CardContent>
<!--
                  <div class="flex items-start gap-2">
                    <p class="text-xs font-medium mt-1">
                      {{ t.tipo_duracion === 'horas' ? formatDateTime(t.fecha_inicio) : formatDate(t.fecha_inicio) }} 
                      <br /> 
                      {{ t.tipo_duracion === 'horas' ? formatDateTime(t.fecha_fin) : formatDate(t.fecha_fin) }}
                    </p>
                  </div>
-->



                  <div class="flex flex-col xl:flex-row gap-8">
                    <div class="w-full">
                      <div v-if="t.escalas && t.escalas.length > 0" class="mb-4">
                        <div v-for="(escala, idx) in t.escalas" :key="idx">

                          <h4 class="font-medium flex items-center gap-2">
                            <Calendar class="h-4 w-4" /> 
                            <span v-if="formatDate(t.fecha_inicio) === formatDate(t.fecha_fin)">
                              {{ formatDateWithDayShort(t.fecha_inicio) }}
                            </span>
                            <span v-else>
                              {{ formatDateWithDayShort(t.fecha_inicio) }} - {{ formatDateWithDayShort(t.fecha_fin) }}
                            </span>
                          </h4>
                          <div class="relative py-2 pl-4 space-y-2 border-l-2 border-slate-200 ml-1.5">
                            <div class="absolute -left-[6px] top-3 h-2.5 w-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                            <div class="font-medium text-slate-800 text-sm flex items-center gap-2">
                              <span v-if="escala.fecha_salida">
                                <Badge variant="outline" class="font-mono text-xs">{{ formatTime(escala.fecha_salida) }}</Badge>
                              </span>{{ escala.origen }} 
                              <ArrowRight class="h-4 w-4 text-muted-foreground" />
                              {{ escala.destino }}
                              <span v-if="escala.fecha_llegada">
                                <Badge variant="outline" class="font-mono text-xs">{{ formatTime(escala.fecha_llegada) }}</Badge>
                              </span>
                            </div>
                            <div class="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 w-fit rounded border border-slate-100 text-xs text-slate-500">
                              <component :is="getTransportIcon(escala.medio || 'tren')" class="h-3 w-3" />
                              <span class="capitalize">{{ escala.medio }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="t.notas" class="mt-2 mb-4 p-3 bg-slate-50 rounded-md text-sm text-slate-600">
                        <span class="font-bold text-xs uppercase text-slate-400 block mb-1">Notas</span>
                        {{ t.notas }}
                      </div>

                    </div>

                  </div>
                </CardContent>
                
              </Card>
            </template>



          </div>
        </div>

        <!-- Sidebar Tasks -->
        <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
          <TasksSidebar 
            :tasks="allTransportTasks"
            @update:status="(id, status) => updateTask(id, { status })"
            @edit="handleEditTask"
          />
          <div class="bg-gray-200/75 rounded-2xl overflow-hidden mt-4 h-[160px] w-full flex items-center justify-center">
            ANUNCIO
          </div>
        </div>
      </div>

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
              Esta acción no se puede deshacer. Se eliminará permanentemente el transporte y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">Eliminar Transporte</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <TransportDrawer 
      v-model:open="isModalOpen" 
      :trip-id="tripId" 
      :current-trip="currentTrip" 
      :item-to-edit="itemToEdit" 
      @saved="onSaved"
    />

  </NuxtLayout>
</template>