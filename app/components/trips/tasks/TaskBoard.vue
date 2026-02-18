<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTripTasks } from '~/composables/useTripTasks'
import { type Task, type TaskGroup, type TaskStatus, type TaskPriority } from '~/types/tasks'
import TaskGroupComponent from './TaskGroup.vue'
import TaskItem from './TaskItem.vue'
import TaskModal from './TaskModal.vue'
import TaskGroupModal from './TaskGroupModal.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Plus, List, LayoutGrid, Calendar as CalendarIcon, Filter } from 'lucide-vue-next'
import { Calendar } from '~/components/ui/calendar'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { es } from 'date-fns/locale'

// Helper to convert DateValue to JS Date manually since radix-vue/date export is not found
const toDate = (dateVal: DateValue) => {
  return new Date(dateVal.year, dateVal.month - 1, dateVal.day)
}

const props = defineProps<{
  tripId: number
}>()

const { 
  tasks, 
  taskGroups, 
  loading, 
  tasksByGroup, 
  init,
  updateTask,
  deleteTask,
  deleteTaskGroup
} = useTripTasks()

// Init data
onMounted(() => {
  init(props.tripId)
})

// View State
const viewMode = ref<'list' | 'groups' | 'calendar'>('groups')
const searchQuery = ref('')
const statusFilter = ref<TaskStatus | 'all'>('all')
const priorityFilter = ref<TaskPriority | 'all'>('all')

// Modals State
const isTaskModalOpen = ref(false)
const isGroupModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)
const selectedGroup = ref<TaskGroup | null>(null)
const defaultGroupIdForTask = ref<number | undefined>(undefined)

// Filter Logic
const filteredTasks = computed(() => {
  return tasks.value.filter(t => {
    // Search
    if (searchQuery.value && !t.title.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    // Status
    if (statusFilter.value !== 'all' && t.status !== statusFilter.value) {
      return false
    }
    // Priority
    if (priorityFilter.value !== 'all' && t.priority !== priorityFilter.value) {
      return false
    }
    return true
  })
})

const filteredGroups = computed(() => {
  // If viewing by groups, we want to show groups that have matching tasks, OR empty groups if no search
  // But strictly, we should filter tasks inside groups.
  // We can reuse tasksByGroup but filtering the tasks inside.
  const result: Record<string, Task[]> = {}
  
  taskGroups.value.forEach(g => {
    const groupTasks = tasksByGroup.value[String(g.id)] || []
    const filtered = groupTasks.filter(t => {
      if (searchQuery.value && !t.title.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
      if (statusFilter.value !== 'all' && t.status !== statusFilter.value) return false
      if (priorityFilter.value !== 'all' && t.priority !== priorityFilter.value) return false
      return true
    })
    
    if (filtered.length > 0 || (!searchQuery.value && statusFilter.value === 'all')) {
      result[String(g.id)] = filtered
    }
  })
  return result
})

// Actions
const openNewTask = (groupId?: number) => {
  selectedTask.value = null
  defaultGroupIdForTask.value = groupId
  isTaskModalOpen.value = true
}

const openEditTask = (task: Task) => {
  selectedTask.value = task
  defaultGroupIdForTask.value = typeof task.task_group === 'object' ? (task.task_group as TaskGroup)?.id as number : task.task_group as number
  isTaskModalOpen.value = true
}

const openNewGroup = () => {
  selectedGroup.value = null
  isGroupModalOpen.value = true
}

const openEditGroup = (group: TaskGroup) => {
  selectedGroup.value = group
  isGroupModalOpen.value = true
}

const handleDeleteGroup = async (id: number | string) => {
  if (confirm('¿Estás seguro de eliminar este grupo y sus tareas?')) {
    await deleteTaskGroup(id)
  }
}

const handleDeleteTask = async (id: number | string) => {
  if (confirm('¿Eliminar tarea?')) {
    await deleteTask(id)
  }
}

// Calendar Logic
// We use a specific ref for the calendar selection.
// We also want to highlight dates that have tasks, but Shadcn Calendar currently (standard) doesn't support dot markers easily via props without custom render.
// We will just filter the list on the right based on selected date.
const calendarDate = ref<DateValue>(today(getLocalTimeZone()))

const calendarAttributes = computed(() => {
  if (!calendarDate.value) return []
  return tasks.value.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d.getDate() === calendarDate.value.day &&
           d.getMonth() + 1 === calendarDate.value.month &&
           d.getFullYear() === calendarDate.value.year
  })
})

// Function to check if a date has tasks for highlighting
const hasTasksOnDate = (date: DateValue) => {
  return tasks.value.some(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    return d.getDate() === date.day &&
           d.getMonth() + 1 === date.month &&
           d.getFullYear() === date.year
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg">
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
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Header / Controls -->
    <div class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div class="flex items-center bg-slate-100 p-1 rounded-lg">
        <button 
          @click="viewMode = 'groups'"
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="viewMode === 'groups' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'"
        >
          <LayoutGrid class="w-4 h-4 mr-2 inline-block" />
          Grupos
        </button>
        <button 
          @click="viewMode = 'list'"
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'"
        >
          <List class="w-4 h-4 mr-2 inline-block" />
          Lista
        </button>
        <button 
          @click="viewMode = 'calendar'"
          class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="viewMode === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'"
        >
          <CalendarIcon class="w-4 h-4 mr-2 inline-block" />
          Calendario
        </button>
      </div>
      <!--
      <div class="flex gap-2 w-full md:w-auto">
        <Button variant="outline" @click="openNewGroup">
          <Plus class="w-4 h-4 mr-2" /> Grupo
        </Button>
        <Button @click="openNewTask()">
          <Plus class="w-4 h-4 mr-2" /> Tarea
        </Button>
      </div>
      -->
    </div>

    <!-- Views -->
    <div v-if="loading" class="py-12 text-center text-slate-500">
      Cargando tareas...
    </div>

    <div v-else class="min-h-[400px]">
      <!-- Groups View -->
      <div v-if="viewMode === 'groups'" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        <TaskGroupComponent
          v-for="group in taskGroups"
          :key="group.id"
          :group="group"
          :tasks="filteredGroups[String(group.id)] || []"
          @add-task="openNewTask"
          @edit-group="openEditGroup"
          @delete-group="handleDeleteGroup"
          @update-task="(id, update) => updateTask(id, update)"
          @edit-task="openEditTask"
        />
        
        <!-- Add Group Card 
        <button 
          @click="openNewGroup"
          class="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors"
        >
          <Plus class="w-8 h-8 mb-2" />
          <span class="font-medium">Nuevo Grupo</span>
        </button>
        -->
      </div>

      <!-- List View -->
      <div v-else-if="viewMode === 'list'" class="space-y-2 max-w-3xl mx-auto">
        <div v-if="filteredTasks.length === 0" class="text-center py-12 text-muted-foreground">
          No se encontraron tareas con los filtros actuales.
        </div>
        <TaskItem
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          @update:status="(id, status) => updateTask(id, { status })"
          @edit="openEditTask"
        />
      </div>

      <!-- Calendar View -->
      <div v-else-if="viewMode === 'calendar'" class="flex flex-col md:flex-row gap-8">
        <div class="w-fit mx-auto md:mx-0">
          <Calendar 
            v-model="calendarDate" 
            locale="es-ES"
            :week-starts-on="1"
            class="rounded-md border shadow bg-white" 
          >
            <template #day="{ day, date }">
              <div class="relative w-full h-full flex items-center justify-center">
                {{ day }}
                <div 
                  v-if="hasTasksOnDate(date)" 
                  class="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              </div>
            </template>
          </Calendar>
        </div>
        <div class="flex-1 space-y-4">
          <h3 class="font-semibold text-lg">
            Tareas para {{ calendarDate ? toDate(calendarDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '' }}
          </h3>
          <div v-if="calendarAttributes.length === 0" class="text-slate-500">
            No hay tareas para este día.
          </div>
          <TaskItem
            v-for="task in calendarAttributes"
            :key="task.id"
            :task="task"
            @update:status="(id, status) => updateTask(id, { status })"
            @edit="openEditTask"
          />
        </div>
      </div>
    </div>

    <!-- Modals -->
    <TaskModal 
      v-model:open="isTaskModalOpen" 
      :task="selectedTask" 
      :trip-id="tripId"
      :default-group-id="defaultGroupIdForTask"
      @saved="init(tripId)"
    />
    
    <TaskGroupModal 
      v-model:open="isGroupModalOpen" 
      :group="selectedGroup"
      :trip-id="tripId"
      @saved="init(tripId)"
    />
  </div>
</template>
