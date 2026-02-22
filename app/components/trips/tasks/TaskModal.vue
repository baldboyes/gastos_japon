<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { type Task, type TaskGroup, TASK_PRIORITIES, TASK_STATUSES } from '~/types/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useTripTasks } from '~/composables/useTripTasks'
import { useTrips } from '~/composables/useTrips'
import { useDirectus } from '~/composables/useDirectus'

const props = defineProps<{
  open: boolean
  task?: Task | null
  tripId: number
  defaultGroupId?: number | string
  defaultEntityType?: string
  defaultEntityId?: number | string
}>()

const emit = defineEmits(['update:open', 'saved', 'delete'])

const { createTask, updateTask, deleteTask, taskGroups } = useTripTasks()
const { travelers, fetchTravelers } = useTrips()
const { directusUserId } = useDirectus()

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

const isEditing = computed(() => !!props.task)
const isCompleted = computed(() => props.task?.status === 'completed')
const isLoading = ref(false)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Cargar viajeros si es necesario
    if (travelers.value.length === 0 && props.tripId) {
      fetchTravelers(props.tripId.toString())
    }

    if (props.task) {
      formData.value = { ...props.task }
      // Manejar relación de grupo si es un objeto
      if (typeof formData.value.task_group === 'object') {
        formData.value.task_group = (formData.value.task_group as TaskGroup).id
      }
      
      // Manejar assigned_to si es un objeto (User expandido)
      if (typeof formData.value.assigned_to === 'object' && formData.value.assigned_to !== null) {
        formData.value.assigned_to = (formData.value.assigned_to as any).id
      }

      // Asegurar que assigned_to sea undefined si es null para que el placeholder funcione
      if (formData.value.assigned_to === null) {
        formData.value.assigned_to = undefined
      }
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
        entity_id: props.defaultEntityId
      }
    }
  }
})

const handleSave = async () => {
  isLoading.value = true
  try {
    // Asegurar payload correcto
    const payload = { ...formData.value }
    if (payload.due_date === '') payload.due_date = null // Manejar string vacío para fecha
    
    // Manejar desasignación explícita
    if (payload.assigned_to === 'unassigned') {
      payload.assigned_to = null as any
    }

    if (isEditing.value && props.task) {
      await updateTask(props.task.id, payload)
    } else {
      await createTask({ ...payload, created_by: undefined }) // Dejar que el backend maneje el usuario creador
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
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Editar Tarea' : 'Nueva Tarea' }}</DialogTitle>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
        <div v-if="isCompleted" class="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm border border-yellow-200 mb-2">
          Esta tarea está completada y no se puede editar. Cambia su estado a "Pendiente" desde el listado si necesitas modificarla.
        </div>

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
          <Input id="due_date" type="datetime-local" v-model="formData.due_date" :disabled="isCompleted" />
        </div>

        <!-- Selector de Asignación -->
        <div class="grid gap-2">
          <Label>Asignado a</Label>
          <Select v-model="formData.assigned_to" :disabled="isCompleted">
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              <SelectItem v-for="t in travelers" :key="t.id" :value="t.id">
                {{ t.first_name }} {{ t.last_name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="grid gap-2">
          <Label>Grupo de Tareas</Label>
          <Select 
            :model-value="formData.task_group?.toString()" 
            @update:model-value="v => formData.task_group = parseInt(v)"
            :disabled="isCompleted"
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un grupo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="g in taskGroups" :key="g.id" :value="g.id.toString()">
                {{ g.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <DialogFooter class="flex justify-between sm:justify-between">
        <Button 
          v-if="isEditing" 
          variant="destructive" 
          @click="handleDelete"
          :disabled="isLoading || isCompleted"
        >
          Eliminar
        </Button>
        <div class="flex gap-2">
          <Button variant="outline" @click="$emit('update:open', false)">Cancelar</Button>
          <Button @click="handleSave" :disabled="isLoading || !formData.title || isCompleted">
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
