<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Shield, Plus, Trash2, Pencil, Phone, MoreVertical, FileDown, PhoneCall, Mail } from 'lucide-vue-next'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { useDirectusFiles } from '~/composables/useDirectusFiles'
import { formatCurrency } from '~/utils/currency'
import { formatPhoneNumber, formatPhoneForHref } from '~/utils/phone'
import { cn } from '~/lib/utils'
import { getStatusColor, getStatusLabel } from '~/utils/trip-status'
import InsuranceDrawer from '~/components/trips/modals/InsuranceDrawer.vue'
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
const { downloadFile } = useDirectusFiles()
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

definePageMeta({
  layout: 'dashboard'
})
</script>

<template>
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row gap-8 items-start relative">
        <!-- Main Content -->
        <div class="flex-1 w-full space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-1">
                <Shield class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">Seguros</h2>
                <p class="text-muted-foreground hidden md:block">Pólizas de viaje y asistencia médica.</p>
              </div>
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
                <div class="flex justify-between w-full">
                  <CardTitle class="text-lg">
                    <span>{{ s.compania }}</span>
                    <span v-if="s.numero_poliza" class="opacity-80 text-sm ml-2">{{ s.numero_poliza }}</span>
                  </CardTitle>
                  <div class="flex items-center gap-2">
                    <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getStatusColor(s.estado_pago || 'pendiente'))">
                      {{ formatCurrency(s.precio || 0, s.moneda) }}
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
              </CardHeader>
              <CardContent>

                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center justify-start gap-1">

                    <Button size="icon" as-child class="h-8 w-8 p-0" v-if="s.telefono_urgencias">
                      <NuxtLink v-if="s.telefono_urgencias" :title="`Llamar: ${s.telefono_urgencias}`" :href="`tel:${s.telefono_urgencias}`"> 
                        <span class="sr-only">Llamar</span>
                        <PhoneCall class="h-6 w-6" />
                      </NuxtLink>
                    </Button>
                    <Button size="icon" as-child class="h-8 w-8 p-0" v-if="s.email_urgencias">
                      <NuxtLink v-if="s.email_urgencias" :title="`Enviar correo: ${s.email_urgencias}`" :href="`mailto:${s.email_urgencias}`"> 
                        <span class="sr-only">Enviar correo</span>
                        <Mail class="h-6 w-6" />
                      </NuxtLink>
                    </Button>

                  </div>
                  <div class="flex items-center justify-end gap-2">
                        aaa
                  </div>
                </div>

                <div v-if="s.notas" class="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm text-slate-600">
                  <p class="font-medium text-yellow-700 text-xs uppercase mb-1">Notas</p>
                  <p class="whitespace-pre-line">{{ s.notas }}</p>
                </div>

                <EntityTasksWidget 
                  :trip-id="parseInt(tripId)"
                  entity-type="insurance"
                  :entity-id="s.id"
                  :title="`Tareas: ${s.compania}`"
                  class="hidden"
                />

                <!-- Adjuntos -->
                <div v-if="s.adjuntos" class="flex items-center gap-2 mt-4">
                  <div v-for="item in s.adjuntos" :key="item.id">
                    <Button 
                      :key="item.id"
                      @click="downloadFile(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)"
                      :title="`Descargar: ${item.directus_files_id?.filename_download || item.filename_download}`"
                    >
                      <FileDown class="h-6 w-6" /> <span class="truncate w-full max-w-[300px]">{{ item.directus_files_id?.filename_download || item.filename_download }}</span>
                    </Button>
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
          <div class="bg-gray-200/75 rounded-2xl overflow-hidden mt-4 h-[80px] w-full flex items-center justify-center">
            &nbsp;
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


      <InsuranceDrawer 
        v-model:open="isModalOpen" 
        :trip-id="tripId" 
        :current-trip="currentTrip" 
        :item-to-edit="itemToEdit" 
        @saved="onSaved"
      />

</template>
