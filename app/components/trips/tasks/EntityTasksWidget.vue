<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTripTasksNew } from '~/composables/useTripTasksNew'
import { type Task } from '~/types/directus'
import { Button } from '~/components/ui/button'
import { ListTodo, Plus } from 'lucide-vue-next'
import TaskItem from '~/components/trips/tasks/TaskItem.vue'
import TaskModal from '~/components/trips/tasks/TaskModal.vue'

const props = defineProps<{
  tripId: number | string
  entityType: string
  entityId: number | string
  title?: string
}>()

const { tasks, fetchTasks, updateTask } = useTripTasksNew()

const isModalOpen = ref(false)
const selectedTask = ref<Task | null>(null)
const isLoading = ref(false)

// Init tasks if not loaded
onMounted(() => {
  if (tasks.value.length === 0 && props.tripId) {
    fetchTasks(Number(props.tripId))
  }
})

// Filter tasks for this entity directly (no group dependency for filtering)
const entityTasks = computed(() => {
  return tasks.value.filter(t => 
    t.entity_type === props.entityType && 
    String(t.entity_id) === String(props.entityId)
  )
})

const pendingCount = computed(() => entityTasks.value.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length)

const handleAddTask = () => {
  selectedTask.value = null
  isModalOpen.value = true
}

const handleEditTask = (task: Task) => {
  selectedTask.value = task
  isModalOpen.value = true
}

// Map entity type to group name for default
const getGroupNameByType = (type: string) => {
  const map: Record<string, string> = {
    flight: 'Vuelos',
    accommodation: 'Alojamientos',
    accommodations: 'Alojamientos',
    transport: 'Transporte',
    transports: 'Transporte',
    activity: 'Actividades',
    activities: 'Actividades',
    insurance: 'Seguros',
    insurances: 'Seguros'
  }
  return map[type] || 'General'
}
</script>

<template>
  <div class="border border-input rounded-lg bg-slate-50/50 p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <ListTodo class="w-4 h-4 text-muted-foreground" />
        <h4 class="font-medium text-sm">Tareas</h4>
        <span v-if="pendingCount > 0" class="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {{ pendingCount }} pendientes
        </span>
      </div>
      <Button size="sm" class="h-8 text-xs" @click="handleAddTask" :disabled="isLoading">
        <Plus class="w-3 h-3 mr-1" />
        Añadir
      </Button>
    </div>

    <div v-if="entityTasks.length > 0" class="space-y-2">
      <TaskItem 
        v-for="task in entityTasks" 
        :key="task.id" 
        :task="task" 
        @update:status="(id, status) => updateTask(id, { status })"
        @edit="handleEditTask"
      />
    </div>
    <div v-else class="text-xs text-muted-foreground text-center py-2 italic">
      No hay tareas asociadas a este elemento.
    </div>

    <TaskModal 
      v-model:open="isModalOpen" 
      :task="selectedTask" 
      :trip-id="Number(tripId)"
      :default-group-id="getGroupNameByType(entityType)"
      :default-entity-type="entityType"
      :default-entity-id="entityId"
      @saved="fetchTasks(Number(tripId))"
    />
  </div>
</template>
