<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import LocationSelector from '~/components/ui/LocationSelector/LocationSelector.vue'
import FileUploader from '~/components/ui/FileUploader/FileUploader.vue'
import FileList from '~/components/ui/FileList/FileList.vue'
import { useDirectus } from '~/composables/useDirectus'
import { readItem } from '@directus/sdk'

const props = defineProps<{
  open: boolean
  tripId: string | number
  currentTrip?: any
  itemToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])

const { createActividad, updateActividad } = useTripOrganization()
const { getAuthenticatedClient } = useDirectus()

// Initialize generic form logic
const { 
  formData, 
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ moneda: 'JPY', precio: 0, estado_pago: 'pendiente', notas: '', ubicacion: { address: '' } }),
  createActividad,
  updateActividad,
  'Actividad'
)

// Sync open state
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

// Watch for edit item changes
watch(() => props.itemToEdit, (newItem) => {
  if (newItem) {
    handleEdit(newItem)
  } else {
    handleCreate()
  }
}, { immediate: true })

const saveActivity = () => {
  handleSave((data) => {
     data.viaje_id = typeof props.tripId === 'string' ? parseInt(props.tripId) : props.tripId
     return data
  }, () => {
    emit('saved')
    emit('update:open', false)
  })
}

const isValid = computed(() => {
  if (!formData.value.nombre) return false
  if (!formData.value.fecha_inicio) return false
  if (!formData.value.fecha_fin) return false
  return true
})

const formId = computed(() => (formData.value as any).id)
const formAdjuntos = computed(() => (formData.value as any).adjuntos || [])

const onFileUploaded = async () => {
  // @ts-ignore
  if (!formData.value.id) return
  
  try {
    const client = await getAuthenticatedClient()
    // @ts-ignore
    const response = await client.request(readItem('actividades', formData.value.id, {
      fields: ['adjuntos.directus_files_id.*']
    }))
    
    // Update attachments in form data
    // @ts-ignore
    if (response && response.adjuntos) {
       // @ts-ignore
       formData.value.adjuntos = response.adjuntos
    }
  } catch (e) {
    console.error('Error refreshing attachments:', e)
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent 
      class="max-h-[90vh] overflow-y-auto sm:max-w-[425px]"
      @interact-outside="(e) => { e.preventDefault() }"
    >
      <DialogHeader>
        <DialogTitle>{{ formData.id ? 'Editar Actividad' : 'Nueva Actividad' }}</DialogTitle>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
          <div>
            <Label>Nombre de la Actividad</Label>
            <Input v-model="formData.nombre" placeholder="Visita Templo, Excursión, etc." />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <Label>Inicio</Label>
              <DateTimePicker 
                v-model="formData.fecha_inicio" 
                :min="currentTrip?.fecha_inicio || undefined"
                :max="currentTrip?.fecha_fin || undefined"
                default-time="10:00"
              />
            </div>
            <div>
              <Label>Fin</Label>
              <DateTimePicker 
                v-model="formData.fecha_fin" 
                :min="currentTrip?.fecha_inicio || undefined"
                :max="currentTrip?.fecha_fin || undefined"
                default-time="12:00"
              />
            </div>
          </div>
          
          <div>
            <Label>Ubicación</Label>
            <LocationSelector 
              v-model="formData.ubicacion" 
              placeholder="Buscar lugar..."
            />
          </div>

          <div class="grid grid-cols-[2fr_1fr_1fr] gap-3">
             <div>
               <Label>Precio Total</Label>
               <Input 
                 type="number" 
                 v-model="formData.precio" 
                 :step="formData.moneda === 'JPY' ? '1' : '0.01'" 
               />
             </div>
             <div>
               <Label>Moneda</Label>
               <Select v-model="formData.moneda">
                <SelectTrigger><SelectValue placeholder="EUR/JPY" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euros (€)</SelectItem>
                  <SelectItem value="JPY">Yenes (¥)</SelectItem>
                </SelectContent>
              </Select>
             </div>
             <div>
               <Label>Estado</Label>
               <Select v-model="formData.estado_pago">
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>
             </div>
          </div>
          
          <div>
            <Label>Enlace Google Maps</Label>
            <Input v-model="formData.enlace_google" placeholder="https://maps.app.goo.gl/..." />
          </div>
          
          <div>
            <Label>Notas</Label>
            <Textarea v-model="formData.notas" placeholder="Información importante..." class="resize-none" />
          </div>

          <div v-if="formId" class="pt-4 border-t border-dashed mt-2">
            <div class="flex justify-between items-center mb-2">
              <Label>Archivos adjuntos</Label>
              <FileUploader collection="actividades" :item-id="formId" @uploaded="onFileUploaded" />
            </div>
            <FileList :files="formAdjuntos" collection="actividades" @deleted="onFileUploaded" />
          </div>
      </div>
      <DialogFooter>
        <Button @click="saveActivity" :disabled="!isValid">Guardar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>