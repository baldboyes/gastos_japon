<script setup lang="ts">
import { computed } from 'vue'
import { type Task } from '~/types/directus'
import { TASK_PRIORITIES } from '~/utils/task-constants'
import { CheckCircle2, Circle, Calendar, User, Link2, ArrowRight } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { useTripOrganizationNew } from '~/composables/useTripOrganizationNew'
import { useTripsNew } from '~/composables/useTripsNew'
import UserAvatar from '~/components/common/UserAvatar.vue'
import { formatDateWithDayShort, formatTime } from '~/utils/dates'
import type { DirectusUser } from '~/types/directus'
const props = defineProps<{
  task: Task
}>()

const emit = defineEmits(['update:status', 'edit'])

const { flights, accommodations, activities, insurances, transports } = useTripOrganizationNew()
const { collaborators } = useTripsNew()

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

const userById = computed(() => {
  const m = new Map<string, any>()
  for (const u of collaborators.value || []) {
    if (u?.id) m.set(String(u.id), u)
  }
  return m
})

const creatorUser = computed<DirectusUser | null>(() => {
  const v: any = (props.task as any).user_created
  if (v && typeof v === 'object') return v
  if (typeof v === 'string') return userById.value.get(v) || null
  return null
})

const assignedUser = computed<DirectusUser | null>(() => {
  const v: any = (props.task as any).assigned_to
  if (v && typeof v === 'object') return v
  if (typeof v === 'string') return userById.value.get(v) || null
  return null
})

const showAssigned = computed(() => !!assignedUser.value && (!creatorUser.value || assignedUser.value.id !== creatorUser.value.id))
const showCreator = computed(() => !!creatorUser.value && !!assignedUser.value)

  // Resolve Entity Name
  const resolvedEntityName = computed(() => {
    const type = props.task.entity_type
    const id = props.task.entity_id

    if (!type || !id) return null

    switch (type) {
      case 'flight':
        const v = flights.value.find(i => String(i.id) === String(id))
        return v ? (v.title || v.flight_number || 'Vuelo') : null
      case 'accommodation':
        const a = accommodations.value.find(i => String(i.id) === String(id))
        return a ? a.name : null
      case 'activity':
        const ac = activities.value.find(i => String(i.id) === String(id))
        return ac ? ac.title : null
      case 'insurance':
        const s = insurances.value.find(i => String(i.id) === String(id))
        return s ? s.provider : null
      case 'transport':
        const t = transports.value.find(i => String(i.id) === String(id))
        return t ? t.name : null

      default:
        return null
    }
  })
</script>

<template>
  <div 
    class="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow group border border-transparent hover:border-gray-200 cursor-pointer"
    :class="{ 'opacity-60': isCompleted }"
    @click="$emit('edit', task)"
  >
    <button @click.stop="toggleStatus" class="mt-0.5 text-gray-400 hover:text-primary transition-colors shrink-0">
      <div v-if="props.task.status === 'completed'" class="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white">
          <CheckCircle2 class="h-3.5 w-3.5" />
      </div>
      <div v-else-if="props.task.status === 'cancelled'" class="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">✕</div>
      <div v-else class="h-5 w-5 rounded-full border-2 border-gray-300" :class="{'border-red-400': isOverdue}"></div>
    </button>
    
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2">
        <h4 :class="cn('font-medium text-sm leading-tight', isCompleted && 'line-through text-muted-foreground')">
          {{ task.title }}
        </h4>
        <div class="flex items-center gap-2 shrink-0">
          <div 
              v-if="task.priority !== 'medium' && !isCompleted" 
              class="w-2 h-2 rounded-full shrink-0" 
              :class="{
                  'bg-red-500': task.priority === 'urgent',
                  'bg-orange-400': task.priority === 'high',
                  'bg-blue-400': task.priority === 'low'
              }"
              :title="$t('tasks.priority.' + task.priority)"
          ></div>
        </div>
      </div>
      
      <p v-if="task.description" class="text-xs text-muted-foreground mt-1 line-clamp-2">
        {{ task.description }}
      </p>
      <div class="flex justify-between items-center gap-3 mt-2">
        <div class="flex items-center gap-3 mt-2">
            <div v-if="task.due_date" class="flex items-center gap-1 text-xs text-muted-foreground" :class="{'text-red-500 font-medium': isOverdue && !isCompleted}">
              <Calendar class="h-3 w-3" />
              {{ formatDateWithDayShort(task.due_date) }}
            </div>
            
            <div v-if="resolvedEntityName" class="flex items-center gap-1 text-xs text-primary/80 font-medium bg-primary/5 px-1.5 py-0.5 rounded">
              <Link2 class="h-3 w-3" />
              <span class="truncate max-w-[120px]">{{ resolvedEntityName }}</span>
            </div>
        </div>
        <div v-if="showCreator || showAssigned" class="flex items-center gap-1">
          <UserAvatar v-if="showCreator" :user="creatorUser" size="sm" />
          <ArrowRight v-if="showCreator && showAssigned" class="h-3 w-3 text-muted-foreground" />
          <UserAvatar v-if="showAssigned" :user="assignedUser" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>
