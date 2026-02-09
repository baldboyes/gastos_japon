<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Shield, Plus, Trash2, Pencil, Phone, MoreVertical } from 'lucide-vue-next'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { formatCurrency } from '~/utils/currency'
import { formatPhoneNumber, formatPhoneForHref } from '~/utils/phone'
import { cn } from '~/lib/utils'
import { getStatusColor, getStatusLabel } from '~/utils/trip-status'
import InsuranceModal from '~/components/trips/modals/InsuranceModal.vue'
import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'
import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
import TaskModal from '~/components/trips/tasks/TaskModal.vue'
import { useTripTasks } from '~/composables/useTripTasks'
import { type Task } from '~/types/tasks'
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
const { seguros, fetchOrganizationData, deleteSeguro } = useTripOrganization()
const { tasks, init: initTasks, updateTask } = useTripTasks()

const isTaskModalOpen = ref(false)
const selectedTaskToEdit = ref<Task | null>(null)

const allInsuranceTasks = computed(() => {
  return tasks.value.filter(t => {
    // Check direct entity type
    if (t.entity_type === 'insurance') return true
    
    // Check group entity type if task doesn't have it set directly
    const group = typeof t.task_group === 'object' ? t.task_group : null
    if (group && group.entity_type === 'insurance') return true
    
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
const insuranceToDelete = ref<number | null>(null)

const confirmDelete = (id: number) => {
  insuranceToDelete.value = id
  isDeleteOpen.value = true
}

const executeDelete = async () => {
  if (insuranceToDelete.value) {
    await deleteSeguro(insuranceToDelete.value)
    isDeleteOpen.value = false
    insuranceToDelete.value = null
  }
}

const handleCreateInsurance = () => {
  itemToEdit.value = null
  isModalOpen.value = true
}

const handleEditInsurance = (s: any) => {
  itemToEdit.value = s
  isModalOpen.value = true
}

const onSaved = () => {
  fetchOrganizationData(tripId)
}

onMounted(() => {
  fetchOrganizationData(tripId)
  initTasks(parseInt(tripId))
})
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row gap-8 items-start relative">
        <!-- Main Content -->
        <div class="flex-1 w-full space-y-4">
          <div class="flex justify-between items-center px-4 md:px-0">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Seguros</h2>
          <p class="text-muted-foreground hidden md:block">Pólizas de viaje y asistencia médica.</p>
        </div>
        <Button @click="handleCreateInsurance"><Plus class="h-4 w-4" /> Añadir</Button>
      </div>

      <div v-if="seguros.length === 0" class=" px-4 md:px-0 text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
        <Shield class="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 class="text-lg font-semibold text-slate-700">No hay seguros registrados</h3>
        <p class="max-w-md mx-auto mt-2">Añade tu seguro de viaje para tener a mano la póliza.</p>
      </div>

      <div v-else class="space-y-4">
        <Card v-for="s in seguros" :key="s.id">
          <CardHeader class="flex flex-row items-start justify-between pb-2">
            <div class="flex items-start gap-3">
              <div class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-1">
                <Shield class="h-5 w-5" />
              </div>
              <div>
                <CardTitle class="text-lg">{{ s.compania }}</CardTitle>
                <div class="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">
                  Póliza: {{ s.numero_poliza }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8 p-0">
                    <span class="sr-only">Abrir menú</span>
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleEditInsurance(s)">
                    <Pencil class="mr-2 h-4 w-4" />
                    <span>Editar</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="confirmDelete(s.id)" class="text-destructive focus:text-destructive">
                    <Trash2 class="mr-2 h-4 w-4" />
                    <span>Eliminar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col xl:flex-row gap-8">
              <div class="w-full">
                <div v-if="s.telefono_asistencia" class="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-md mb-4">
                  <div class="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center text-green-700">
                    <Phone class="h-4 w-4" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-green-800 uppercase">Teléfono Asistencia</p>
                    <a :href="`tel:${formatPhoneForHref(s.telefono_asistencia)}`" class="text-lg font-bold text-green-700 hover:underline">
                      {{ formatPhoneNumber(s.telefono_asistencia) }}
                    </a>
                  </div>
                </div>

                <div v-if="s.notas" class="mb-4 p-3 bg-slate-50 rounded-md text-sm text-slate-600">
                  <span class="font-bold text-xs uppercase text-slate-400 block mb-1">Coberturas / Notas</span>
                  {{ s.notas }}
                </div>

                <div class="flex justify-end pt-2 border-t">
                  <div class="flex items-center gap-3">
                    <span :class="cn('text-[10px] px-1.5 py-1 rounded border uppercase font-bold tracking-wide', getStatusColor(s.estado_pago || 'pendiente'))">
                      {{ getStatusLabel(s.estado_pago || 'pendiente') }}
                    </span>
                    <span class="font-mono">{{ formatCurrency(s.precio, s.moneda) }}</span>
                    <div class="flex gap-1">
                      <!-- Actions -->
                    </div>
                  </div>
                </div>
              </div>
              <div class="w-full xl:max-w-md">
                <EntityTasksWidget 
                  :trip-id="parseInt(tripId)"
                  entity-type="insurance"
                  :entity-id="s.id"
                  :title="`Tareas: ${s.compania}`"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      <!-- Sidebar Tasks -->
      <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
        <TasksSidebar 
          :tasks="allInsuranceTasks"
          @update:status="(id, status) => updateTask(id, { status })"
          @edit="handleEditTask"
        />
        <div class="bg-gray-200/75 rounded-2xl overflow-hidden mt-4 h-[170px] w-full flex items-center justify-center">
          ANUNCIO
        </div>
      </div>
      </div>

      <InsuranceModal 
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el seguro y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">Eliminar Seguro</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </NuxtLayout>
</template>
