<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useTripTasksNew } from '~/composables/useTripTasksNew'
import type { Task } from '~/types/directus'
import type { TaskPriority, TaskStatus } from '~/utils/task-constants'
import TaskItem from '~/components/trips/tasks/TaskItem.vue'
import TaskModal from '~/components/trips/tasks/TaskModal.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  tripId: number
}>()

const { tasks, loading, tasksByGroup, fetchTasks, updateTask, deleteTask } = useTripTasksNew()

onMounted(() => {
  fetchTasks(props.tripId)
})

const searchQuery = ref('')
const statusFilter = ref<TaskStatus | 'all'>('all')
const priorityFilter = ref<TaskPriority | 'all'>('all')

const isTaskModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)
const newTaskGroup = ref<string | undefined>(undefined)

const showEmptyGroups = computed(() => {
  return searchQuery.value.trim() === '' && statusFilter.value === 'all' && priorityFilter.value === 'all'
})

const filteredTasksByGroup = computed(() => {
  const grouped = tasksByGroup.value
  const result: Record<string, Task[]> = {}

  Object.entries(grouped).forEach(([groupName, groupTasks]) => {
    result[groupName] = groupTasks.filter(t => {
    if (searchQuery.value && !(t.title || '').toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (statusFilter.value !== 'all' && t.status !== statusFilter.value) return false
    if (priorityFilter.value !== 'all' && t.priority !== priorityFilter.value) return false
    return true
    })
  })

  return result
})

const groupNames = computed(() => {
  const preferred = ['General', 'Vuelos', 'Alojamientos', 'Transporte', 'Actividades', 'Seguros']
  const keys = Object.keys(tasksByGroup.value || {})
  const rest = keys.filter(k => !preferred.includes(k)).sort((a, b) => a.localeCompare(b))
  return [...preferred.filter(k => keys.includes(k)), ...rest]
})

const totalFilteredCount = computed(() => {
  return Object.values(filteredTasksByGroup.value).reduce((acc, arr) => acc + arr.length, 0)
})

const openNewTask = (groupName?: string) => {
  selectedTask.value = null
  newTaskGroup.value = groupName
  isTaskModalOpen.value = true
}

const openEditTask = (task: Task) => {
  selectedTask.value = task
  newTaskGroup.value = undefined
  isTaskModalOpen.value = true
}

const handleDeleteTask = async (id: number | string) => {
  if (!confirm('¿Eliminar tarea?')) return
  await deleteTask(Number(id))
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-lg">
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="searchQuery">Buscar</Label>
        <Input v-model="searchQuery" placeholder="Buscar tareas..." />
      </div>
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="statusFilter">Estado</Label>
        <Select v-model="statusFilter">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="priorityFilter">Prioridad</Label>
        <Select v-model="priorityFilter">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1" />
      <Button @click="openNewTask()">
        <Plus class="w-4 h-4 mr-2" /> Nueva tarea
      </Button>
    </div>

    <div v-if="loading" class="py-12 text-center text-slate-500">
      Cargando tareas...
    </div>

    <div v-else class="space-y-4">
      <div v-if="totalFilteredCount === 0" class="text-center py-12 text-muted-foreground">
        No se encontraron tareas con los filtros actuales.
      </div>
      <div v-for="groupName in groupNames" :key="groupName" class="bg-white rounded-lg p-4">
        <div v-if="showEmptyGroups || (filteredTasksByGroup[groupName]?.length || 0) > 0" class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-slate-800">{{ groupName }}</h3>
              <span class="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                {{ filteredTasksByGroup[groupName]?.length || 0 }}
              </span>
            </div>
            <Button size="sm" variant="outline" @click="openNewTask(groupName)">
              <Plus class="w-4 h-4 mr-2" /> Añadir
            </Button>
          </div>
          <div v-if="(filteredTasksByGroup[groupName]?.length || 0) === 0" class="text-sm text-muted-foreground italic py-2">
            No hay tareas en este grupo.
          </div>
          <div v-else class="space-y-2">
            <TaskItem
              v-for="task in filteredTasksByGroup[groupName]"
              :key="task.id"
              :task="task"
              @update:status="(id, status) => updateTask(Number(id), { status })"
              @edit="openEditTask"
            />
          </div>
        </div>
      </div>
    </div>

    <TaskModal
      v-model:open="isTaskModalOpen"
      :task="selectedTask"
      :trip-id="tripId"
      :default-group-id="newTaskGroup"
      @saved="fetchTasks(tripId)"
    />
  </div>
</template>
