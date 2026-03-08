<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { type Task } from '~/types/directus'
import { TASK_PRIORITIES, TASK_STATUSES } from '~/utils/task-constants'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { ScrollArea } from '~/components/ui/scroll-area'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import { useTripTasksNew } from '~/composables/useTripTasksNew'
import { useTripsNew } from '~/composables/useTripsNew'
import { useDirectusRepo } from '~/composables/useDirectusRepo'

const props = defineProps<{
  open: boolean
  task?: Task | null
  tripId: number
  defaultGroupId?: number | string
  defaultEntityType?: string
  defaultEntityId?: number | string
}>()

const emit = defineEmits(['update:open', 'saved', 'delete'])

const { createTask, updateTask, deleteTask, tasksByGroup } = useTripTasksNew()
const { collaborators, currentTrip } = useTripsNew() // Use collaborators instead of travelers if travelers doesn't exist
const { directusUserId } = useDirectusRepo()

const formData = ref<Partial<Task>>({
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  due_date: '',
  task_group: undefined,
  assigned_to: undefined,
  entity_type: undefined,
  entity_id: undefined
})

const toIsoLocal = (v: any): string | null => {
  if (!v) return null
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return v

  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${da}T${h}:${min}`
}

const isEditing = computed(() => !!props.task)
const isCompleted = computed(() => props.task?.status === 'completed')
const isLoading = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

// Mock travelers from collaborators or empty array if not implemented yet
const travelers = computed(() => collaborators.value || [])

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.task) {
      formData.value = { ...props.task }
      
      // Manejar assigned_to si es un objeto (User expandido)
      if (typeof formData.value.assigned_to === 'object' && formData.value.assigned_to !== null) {
        formData.value.assigned_to = (formData.value.assigned_to as any).id
      }

      // Asegurar que assigned_to sea undefined si es null para que el placeholder funcione
      if (formData.value.assigned_to === null) {
        formData.value.assigned_to = undefined
      }

      formData.value.due_date = toIsoLocal((formData.value as any).due_date) || null
    } else {
      formData.value = {
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        task_group: props.defaultGroupId,
        assigned_to: directusUserId.value || undefined, // Default to current user
        entity_type: props.defaultEntityType as any,
        entity_id: props.defaultEntityId,
        due_date: null
      }
    }
  }
})

const handleSave = async () => {
  isLoading.value = true
  try {
    const assignedToRaw: any = (formData.value as any).assigned_to
    const assignedTo = assignedToRaw && typeof assignedToRaw === 'object'
      ? String(assignedToRaw.id || '')
      : (assignedToRaw === null ? null : (assignedToRaw ? String(assignedToRaw) : null))

    const payload: Partial<Task> = {
      title: formData.value.title,
      description: formData.value.description,
      priority: formData.value.priority,
      status: formData.value.status,
      due_date: toIsoLocal(formData.value.due_date),
      task_group: formData.value.task_group,
      assigned_to: assignedTo as any,
      entity_type: formData.value.entity_type,
      entity_id: formData.value.entity_id
    }

    if (isEditing.value && props.task) {
      await updateTask(props.task.id, payload)
    } else {
      await createTask({ ...payload, trip_id: props.tripId }) 
    }
    emit('saved')
    emit('update:open', false)
  } catch (e) {
    // Error manejado en composable
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async () => {
  if (!props.task || !confirm('¿Estás seguro de eliminar esta tarea?')) return
  
  isLoading.value = true
  try {
    await deleteTask(props.task.id)
    emit('saved') // Refrescar lista
    emit('update:open', false)
  } catch (e) {
    // Error handled
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl">
      <DrawerHeader class="w-full max-w-3xl mx-auto px-4">
        <DrawerTitle>{{ isEditing ? 'Editar Tarea' : 'Nueva Tarea' }}</DrawerTitle>
      </DrawerHeader>

      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="w-full max-w-3xl mx-auto px-4 grid gap-4 py-4">
        <div class="grid gap-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" v-model="formData.title" placeholder="Comprar billetes..." :disabled="isCompleted" />
        </div>
        
        <div class="grid gap-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" v-model="formData.description" placeholder="Detalles adicionales..." :disabled="isCompleted" />
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label>Prioridad</Label>
            <Select v-model="formData.priority" :disabled="isCompleted">
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in TASK_PRIORITIES" :key="p.value" :value="p.value">
                  {{ p.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="grid gap-2">
            <Label>Estado</Label>
            <Select v-model="formData.status" :disabled="isCompleted">
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="s in TASK_STATUSES" :key="s.value" :value="s.value">
                  {{ s.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div class="grid gap-2">
          <Label htmlFor="due_date">Fecha Límite</Label>
          <DateTimePicker
            v-model="formData.due_date as any"
            :min="currentTrip?.start_date || undefined"
            :max="currentTrip?.end_date || undefined"
            full-width
          />
        </div>

        <div class="grid gap-2">
          <Label>Asignado a</Label>
          <Select 
            :model-value="(formData.assigned_to ?? 'unassigned') as any" 
            @update:model-value="(v) => formData.assigned_to = v === 'unassigned' ? null : String(v)" 
            :disabled="isCompleted"
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              <SelectItem v-for="t in travelers" :key="t.id" :value="String(t.id)">
                {{ t.first_name }} {{ t.last_name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="grid gap-2">
          <Label>Grupo de Tareas</Label>
          <Select 
            v-model="formData.task_group" 
            :disabled="isCompleted"
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un grupo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Vuelos">Vuelos</SelectItem>
              <SelectItem value="Alojamientos">Alojamientos</SelectItem>
              <SelectItem value="Transporte">Transporte</SelectItem>
              <SelectItem value="Actividades">Actividades</SelectItem>
              <SelectItem value="Seguros">Seguros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        </div>
      </ScrollArea>

      <DrawerFooter class="w-full max-w-3xl mx-auto px-4 flex justify-between sm:justify-between">
        <Button 
          v-if="isEditing" 
          variant="destructive" 
          @click="handleDelete"
          :disabled="isLoading"
        >
          Eliminar
        </Button>
        <div class="flex gap-2">
          <Button variant="outline" @click="isOpen = false">Cancelar</Button>
          <Button @click="handleSave" :disabled="isLoading || !formData.title">
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
          </Button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
