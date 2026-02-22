<script setup lang="ts">
import { type TaskGroup, type Task } from '~/types/tasks'
import TaskItem from './TaskItem.vue'
import { MoreVertical, Plus, Plane, Bed, Ticket, Shield, Globe, Train, Pencil, Trash2 } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
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
  <div class="space-y-3 bg-gray-200/75 rounded-2xl pt-4 px-4">
    <div class="flex items-center justify-between">
    
      <div class="flex items-center gap-2">
        <component :is="entityIcon" class="w-4 h-4" />
        <h3 class="font-semibold text-lg">{{ group.name }}</h3>
        <span class="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">{{ tasks.length }}</span>
      </div>
      <Button size="icon" class="h-8 w-8" @click="$emit('add-task', group.id)">
        <Plus class="h-4 w-4" />
      </Button>

      <!--
        <div class="flex items-center gap-1">
          <Button size="icon" class="h-8 w-8" @click="$emit('add-task', group.id)">
            <Plus class="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="h-8 w-8 p-0">
                <span class="sr-only">Abrir menú</span>
                <MoreVertical class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="$emit('edit-group', group)">
                <Pencil class="mr-2 h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="$emit('delete-group', group.id)" class="text-destructive focus:text-destructive">
                <Trash2 class="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      -->
    </div>
    
    <!-- Progress Bar -->
    <div v-if="tasks.length > 0" class="h-1 w-full bg-white rounded-full overflow-hidden">
      <div class="h-full bg-primary transition-all duration-500" :style="{ width: `${progress}%` }" />
    </div>

    <div v-if="tasks.length === 0" class="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg mb-4">
      No hay tareas en este grupo
    </div>
    <template v-else>
      <ScrollArea class="w-full h-[450px]">
        <div class="space-y-2 pb-4">
          <TaskItem 
            v-for="task in tasks" :key="task.id"
            :task="task" 
            @update:status="(id, status) => $emit('update-task', id, { status })"
            @edit="t => $emit('edit-task', t)"
          />
        </div>
      </ScrollArea>
    </template>
  </div>
</template>
