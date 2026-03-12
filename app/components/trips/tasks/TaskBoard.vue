<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { tv } from 'tailwind-variants'
import { useTripTasksNew } from '~/composables/useTripTasksNew'
import type { Task } from '~/types/directus'
import type { TaskPriority, TaskStatus } from '~/utils/task-constants'
import TaskItem from '~/components/trips/tasks/TaskItem.vue'
import TaskModal from '~/components/trips/tasks/TaskModal.vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const props = defineProps<{
  tripId: number
}>()

const { t } = useI18n()

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

  Object.entries(grouped as Record<string, Task[]>).forEach(([groupName, groupTasks]) => {
    result[groupName] = (groupTasks || []).filter(t => {
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
  if (!confirm(String(t('trip_tasks_board.confirm_delete')))) return
  await deleteTask(Number(id))
}

const styles = computed(() => taskBoardStyles())

const taskBoardStyles = tv({
  slots: {
    root: 'space-y-6',
    filters: 'flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-2xl border border-input',
    field: 'grid w-full max-w-sm items-center gap-1.5',
    selectTrigger: 'w-40',
    spacer: 'flex-1',
    loading: 'py-12 text-center text-slate-500',
    emptyResults: 'text-center py-12 text-muted-foreground col-span-2',
    groups: 'space-y-4 grid grid-cols-2 gap-4',
    groupCard: 'bg-neutral-200/75 rounded-2xl p-4',
    groupInner: 'space-y-3',
    groupHeader: 'flex items-center justify-between',
    groupTitleRow: 'flex items-center gap-2',
    groupTitle: 'font-semibold text-slate-800',
    groupEmpty: 'text-sm text-muted-foreground italic py-2',
    tasksList: 'space-y-2',
  }
})
</script>

<template>
  <div :class="styles.root()">
    <div :class="styles.filters()">
      <div :class="styles.field()">
        <Label for="searchQuery">{{ t('trip_tasks_board.search_label') }}</Label>
        <Input id="searchQuery" v-model="searchQuery" :placeholder="String(t('trip_tasks_board.search_placeholder'))" />
      </div>
      <div :class="styles.field()">
        <Label for="statusFilter">{{ t('trip_tasks_board.status_label') }}</Label>
        <Select v-model="statusFilter">
          <SelectTrigger :class="styles.selectTrigger()">
            <SelectValue :placeholder="String(t('trip_tasks_board.status_placeholder'))" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('trip_tasks_board.status_all') }}</SelectItem>
            <SelectItem value="pending">{{ t('trip_tasks_board.status_pending') }}</SelectItem>
            <SelectItem value="in_progress">{{ t('trip_tasks_board.status_in_progress') }}</SelectItem>
            <SelectItem value="completed">{{ t('trip_tasks_board.status_completed') }}</SelectItem>
            <SelectItem value="cancelled">{{ t('trip_tasks_board.status_cancelled') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div :class="styles.field()">
        <Label for="priorityFilter">{{ t('trip_tasks_board.priority_label') }}</Label>
        <Select v-model="priorityFilter">
          <SelectTrigger :class="styles.selectTrigger()">
            <SelectValue :placeholder="String(t('trip_tasks_board.priority_placeholder'))" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('trip_tasks_board.priority_all') }}</SelectItem>
            <SelectItem value="urgent">{{ t('tasks.priority.urgent') }}</SelectItem>
            <SelectItem value="high">{{ t('tasks.priority.high') }}</SelectItem>
            <SelectItem value="medium">{{ t('tasks.priority.medium') }}</SelectItem>
            <SelectItem value="low">{{ t('tasks.priority.low') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div :class="styles.spacer()" />
      <Button @click="openNewTask()">
        <Plus class="w-4 h-4 mr-2" /> {{ t('trip_tasks_board.new_task') }}
      </Button>
    </div>

    <div v-if="loading" :class="styles.loading()">
      {{ t('trip_tasks_board.loading') }}
    </div>

    <div v-else>
      <div v-if="totalFilteredCount === 0" :class="styles.emptyResults()">
        {{ t('trip_tasks_board.no_results') }}
      </div>
      <div v-else :class="styles.groups()">
        <div v-for="groupName in groupNames" :key="groupName" :class="styles.groupCard()">
          <div :class="styles.groupInner()">
            <div :class="styles.groupHeader()">
              <div :class="styles.groupTitleRow()">
                <h3 :class="styles.groupTitle()">{{ groupName }}</h3>
              </div>
              <div :class="styles.groupTitleRow()">
                <Badge variant="secondary">
                  {{ filteredTasksByGroup[groupName]?.length || 0 }}
                </Badge>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="openNewTask(groupName)">
                  <Plus class="w-4 h-4" /> 
                </Button>
              </div>
            </div>
            <div v-if="(filteredTasksByGroup[groupName]?.length || 0) === 0" :class="styles.groupEmpty()">
              {{ t('trip_tasks_board.group_empty') }}
            </div>
            <div v-else :class="styles.tasksList()">
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
