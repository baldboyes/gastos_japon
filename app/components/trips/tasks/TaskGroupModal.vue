<script setup lang="ts">
import { ref, watch } from 'vue'
import { type TaskGroup, type TaskEntityType } from '~/types/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useTripTasks } from '~/composables/useTripTasks'
import { useTripOrganization } from '~/composables/useTripOrganization'

const props = defineProps<{
  open: boolean
  group?: TaskGroup | null
  tripId: number
}>()

const emit = defineEmits(['update:open', 'saved'])

const { createTaskGroup, updateTaskGroup } = useTripTasks()
const { vuelos, alojamientos, actividades, transportes, seguros, fetchOrganizationData } = useTripOrganization()

const formData = ref<Partial<TaskGroup>>({
  name: '',
  description: '',
  entity_type: 'travel',
  entity_id: undefined
})

const isEditing = computed(() => !!props.group)
const isLoading = ref(false)

// Fetch org data when modal opens to populate selectors
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    fetchOrganizationData(props.tripId.toString())
    
    if (props.group) {
      formData.value = { ...props.group }
    } else {
      formData.value = {
        name: '',
        description: '',
        entity_type: 'travel',
        entity_id: props.tripId, // Default to trip
        viaje_id: props.tripId
      }
    }
  }
})

const ENTITY_TYPES: { value: TaskEntityType; label: string }[] = [
  { value: 'travel', label: 'Viaje General' },
  { value: 'flight', label: 'Vuelo' },
  { value: 'accommodation', label: 'Alojamiento' },
  { value: 'activity', label: 'Actividad' },
  { value: 'insurance', label: 'Seguro' }
]

const availableEntities = computed(() => {
  const type = formData.value.entity_type
  if (type === 'flight') return vuelos.value.map(v => ({ id: v.id, label: v.titulo || `${v.origen} -> ${v.destino}` }))
  if (type === 'accommodation') return alojamientos.value.map(a => ({ id: a.id, label: a.nombre }))
  if (type === 'activity') return actividades.value.map(a => ({ id: a.id, label: a.nombre }))
  if (type === 'insurance') return seguros.value.map(s => ({ id: s.id, label: s.compania }))
  return []
})

const handleSave = async () => {
  isLoading.value = true
  try {
    const payload = { ...formData.value, viaje_id: props.tripId }
    if (isEditing.value && props.group) {
      await updateTaskGroup(props.group.id, payload)
    } else {
      await createTaskGroup(payload)
    }
    emit('saved')
    emit('update:open', false)
  } catch (e) {
    // Error handled in composable
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Editar Grupo' : 'Nuevo Grupo de Tareas' }}</DialogTitle>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label htmlFor="name">Nombre del Grupo</Label>
          <Input id="name" v-model="formData.name" placeholder="Ej: Preparativos, Vuelo Ida..." />
        </div>
        
        <div class="grid gap-2">
          <Label>Tipo de Entidad</Label>
          <Select v-model="formData.entity_type">
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in ENTITY_TYPES" :key="t.value" :value="t.value">
                {{ t.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div v-if="formData.entity_type !== 'travel' && formData.entity_type !== 'category'" class="grid gap-2">
          <Label>Entidad Asociada</Label>
          <Select 
            :model-value="formData.entity_id?.toString()" 
            @update:model-value="v => formData.entity_id = parseInt(v)"
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="e in availableEntities" :key="e.id" :value="e.id.toString()">
                {{ e.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">Cancelar</Button>
        <Button @click="handleSave" :disabled="isLoading || !formData.name">
          {{ isLoading ? 'Guardando...' : 'Guardar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
