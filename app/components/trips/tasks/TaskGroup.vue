<script setup lang="ts">
import { type TaskGroup, type Task } from '~/types/tasks'
import TaskItem from './TaskItem.vue'
import { MoreHorizontal, Plus, Plane, Bed, Ticket, Shield, Globe, Train } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  group: TaskGroup
  tasks: Task[]
}>()

const emit = defineEmits(['add-task', 'edit-group', 'delete-group', 'update-task', 'edit-task', 'delete-task'])

const completedCount = computed(() => props.tasks.filter(t => t.status === 'completed').length)
const progress = computed(() => props.tasks.length ? Math.round((completedCount.value / props.tasks.length) * 100) : 0)

const entityIcon = computed(() => {
  switch (props.group.entity_type) {
    case 'flight': return Plane
    case 'accommodation': return Bed
    case 'activity': return Ticket
    case 'insurance': return Shield
    case 'travel': return Globe
    case 'transport': return Train
    default: return Globe
  }
})

const entityLabel = computed(() => {
  switch (props.group.entity_type) {
    case 'flight': return 'Vuelo'
    case 'accommodation': return 'Alojamiento'
    case 'activity': return 'Actividad'
    case 'insurance': return 'Seguro'
    case 'travel': return 'General'
    case 'transport': return 'Transporte'
    default: return 'General'
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-0.5">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-lg">{{ group.name }}</h3>
          <span class="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">{{ tasks.length }}</span>
        </div>
        
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <component :is="entityIcon" class="w-3 h-3" />
          <span>{{ entityLabel }}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('add-task', group.id)">
          <Plus class="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('edit-group', group)">Editar Grupo</DropdownMenuItem>
            <DropdownMenuItem class="text-red-600" @click="$emit('delete-group', group.id)">Eliminar Grupo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div v-if="tasks.length > 0" class="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
      <div class="h-full bg-primary transition-all duration-500" :style="{ width: `${progress}%` }" />
    </div>

    <div class="space-y-2">
      <TaskItem 
        v-for="task in tasks" 
        :key="task.id" 
        :task="task" 
        @update:status="(id, status) => $emit('update-task', id, { status })"
        @edit="t => $emit('edit-task', t)"
      />
      <div v-if="tasks.length === 0" class="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
        No hay tareas en este grupo
      </div>
    </div>
  </div>
</template>
