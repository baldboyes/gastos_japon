<script setup lang="ts">
import { computed } from 'vue'
import { ListTodo, Plus } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import TaskItem from '~/components/trips/tasks/TaskItem.vue'
import type { Task } from '~/types/directus'
import type { TaskPriority, TaskStatus } from '~/utils/task-constants'

const { t } = useI18n()

const props = defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  (e: 'update:status', id: number | string, status: TaskStatus): void
  (e: 'edit', task: Task): void
  (e: 'add'): void
}>()

const priorityOrder: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
}

const sortedTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    // 1. Status: Completed/Cancelled at the bottom
    const isACompleted = a.status === 'completed' || a.status === 'cancelled'
    const isBCompleted = b.status === 'completed' || b.status === 'cancelled'

    if (isACompleted && !isBCompleted) return 1
    if (!isACompleted && isBCompleted) return -1

    // 2. Priority: Higher priority first
    const priorityA = priorityOrder[a.priority as TaskPriority] || 0
    const priorityB = priorityOrder[b.priority as TaskPriority] || 0

    if (priorityA !== priorityB) {
      return priorityB - priorityA
    }
    
    // 3. Date (optional secondary sort, keep original if needed or sort by due date)
    // For now, priority is the main request.
    return 0
  })
})
</script>

<template>
  <div class="bg-neutral-200/75 rounded-2xl overflow-hidden">
    <div class="p-4 flex items-center justify-between">
      <h3 class="font-bold text-slate-800 flex items-center gap-2">
        <ListTodo class="w-4 h-4" />
        Tareas
      </h3>
      <div class="flex items-center gap-2">
        <Badge variant="secondary">{{ tasks.length }}</Badge>
        <Button variant="ghost" size="icon" class="h-8 w-8" :title="t('tasks.actions.add')" :aria-label="t('tasks.actions.add')" @click="emit('add')">
          <Plus class="h-4 w-4" />
        </Button>
      </div>
    </div>
    <ScrollArea class="w-full h-[300px] lg:h-[calc(100vh-300px)] min-h-[450px]">
      <div class="p-4">
        <div v-if="sortedTasks.length > 0" class="space-y-2">
          <TaskItem 
            v-for="task in sortedTasks" 
            :key="task.id" 
            :task="task" 
            @update:status="(id, status) => emit('update:status', id, status)"
            @edit="task => emit('edit', task)"
          />
        </div>
        <div v-else class="text-center text-muted-foreground italic text-sm py-8">
          No hay tareas registradas.
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
