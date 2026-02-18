<script setup lang="ts">
import { computed } from 'vue'
import { type Task, TASK_PRIORITIES } from '~/types/tasks'
import { CheckCircle2, Circle, Calendar, User, Link2, ArrowRight } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { useTripOrganization } from '~/composables/useTripOrganization'
import UserAvatar from '~/components/common/UserAvatar.vue'
import { formatDateWithDayShort } from '~/utils/dates'
const props = defineProps<{
  task: Task
}>()

const emit = defineEmits(['update:status', 'edit'])

const { vuelos, alojamientos, actividades, seguros, transportes } = useTripOrganization()

const priorityColor = computed(() => {
  return TASK_PRIORITIES.find(p => p.value === props.task.priority)?.color || 'bg-gray-100 text-gray-800'
})

const isCompleted = computed(() => props.task.status === 'completed' || props.task.status === 'cancelled')
const isCancelled = computed(() => props.task.status === 'cancelled')

const toggleStatus = () => {
  const newStatus = isCompleted.value ? 'pending' : 'completed'
  emit('update:status', props.task.id, newStatus)
}

const isOverdue = computed(() => {
  if (!props.task.due_date || isCompleted.value) return false
  return new Date(props.task.due_date) < new Date()
})

const assignedUserName = computed(() => {
  if (!props.task.assigned_to) return null
  if (typeof props.task.assigned_to === 'object' && props.task.assigned_to !== null) {
    if ('first_name' in props.task.assigned_to) {
      return (props.task.assigned_to as any).first_name || 'Usuario'
    }
  }
  return 'Usuario'
})

const creatorUserName = computed(() => {
  if (!props.task.user_created) return null
  if (typeof props.task.user_created === 'object' && props.task.user_created !== null) {
    if ('first_name' in props.task.user_created) {
      return (props.task.user_created as any).first_name || 'Creador'
    }
  }
  return 'Creador'
})

const isAssignedToDifferentUser = computed(() => {
  if (!props.task.assigned_to || !props.task.user_created) return false
  
  const creatorId = typeof props.task.user_created === 'object' ? (props.task.user_created as any).id : props.task.user_created
  const assignedId = typeof props.task.assigned_to === 'object' ? (props.task.assigned_to as any).id : props.task.assigned_to
  
  return creatorId !== assignedId
})

// Resolve Entity Name
const resolvedEntityName = computed(() => {
  const type = props.task.entity_type
  const id = props.task.entity_id

  if (!type || !id) return null

  switch (type) {
    case 'flight':
      const v = vuelos.value.find(i => String(i.id) === String(id))
      return v ? (v.titulo || `${v.origen} -> ${v.destino}`) : null
    case 'accommodation':
      const a = alojamientos.value.find(i => String(i.id) === String(id))
      return a ? a.nombre : null
    case 'activity':
      const ac = actividades.value.find(i => String(i.id) === String(id))
      return ac ? ac.nombre : null
    case 'insurance':
      const s = seguros.value.find(i => String(i.id) === String(id))
      return s ? s.compania : null
    case 'transport':
      const t = transportes.value.find(i => String(i.id) === String(id))
      return t ? t.nombre : null

    default:
      return null
  }
})
</script>

<template>
  <div 
    class="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow group"
    :class="{ 'opacity-60': isCompleted }"
  >
    <button @click.stop="toggleStatus" class="mt-0 text-gray-400 hover:text-primary transition-colors shrink-0">
      <CheckCircle2 v-if="props.task.status === 'completed'" class="h-5 w-5 text-green-500" />
      <div v-else-if="props.task.status === 'cancelled'" class="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">✕</div>
      <Circle v-else class="h-5 w-5 rounded-full" :class="priorityColor" />
    </button>
    
    <div class="relative flex-1 min-w-0 cursor-pointer" @click="$emit('edit', task)">
      <div class="flex items-center justify-between gap-2">
        <h4 :class="cn('font-medium text-sm leading-tight', isCompleted && 'line-through text-muted-foreground')">
          {{ task.title }}
        </h4>
      </div>
      
      <!-- Entity Link Indicator -->
      <div v-if="resolvedEntityName" class="flex items-center gap-1 mt-1 text-xs text-primary/80 font-medium">
        <Link2 class="h-3 w-3" />
        <span class="truncate">{{ resolvedEntityName }}</span>
      </div>
      
      <p v-if="task.description" class="text-xs text-muted-foreground mt-1 line-clamp-2">
        {{ task.description }}
      </p>

      <div class="flex items-center justify-between pr-4 py-2">
        <div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span v-if="task.due_date" class="flex items-center gap-1" :class="{'text-red-500 font-medium': isOverdue}">
            <Calendar class="h-3 w-3" />
            {{ formatDateWithDayShort(task.due_date) }} {{ formatTime(task.due_date) }}
          </span>
        </div>

        <div v-if="task.assigned_to" class="flex items-center gap-1">
          <!-- If assigned to different user, show Creator -> Assignee -->
          <template v-if="isAssignedToDifferentUser">
            <UserAvatar 
              :user="typeof task.user_created === 'object' ? task.user_created : undefined" 
              :fallback="(creatorUserName || 'C').charAt(0)"
              size="sm" 
              class="h-3 w-3" 
            />
            <ArrowRight class="ml-5 mr-0 h-4 w-4 text-muted-foreground" />
          </template>
          
          <UserAvatar 
            :user="typeof task.assigned_to === 'object' ? task.assigned_to : undefined" 
            :fallback="(assignedUserName || 'U').charAt(0)"
            size="sm" 
            class="h-3 w-3" 
          />
        </div>
      </div>

    </div>
  </div>
</template>
