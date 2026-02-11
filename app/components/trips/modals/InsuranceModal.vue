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

const { createSeguro, updateSeguro } = useTripOrganization()
const { getAuthenticatedClient } = useDirectus()

// Initialize generic form logic
const { 
  formData, 
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ moneda: 'EUR', estado_pago: 'pendiente' }),
  createSeguro,
  updateSeguro,
  'Seguro'
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

const saveInsurance = () => {
  handleSave((data) => {
     data.viaje_id = typeof props.tripId === 'string' ? parseInt(props.tripId) : props.tripId
     return data
  }, () => {
    emit('saved')
    emit('update:open', false)
  })
}

const isValid = computed(() => {
  if (!formData.value.compania) return false
  if (!formData.value.numero_poliza) return false
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
    const response = await client.request(readItem('seguros', formData.value.id, {
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
        <DialogTitle>{{ formData.id ? 'Editar Seguro' : 'Nuevo Seguro' }}</DialogTitle>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <Label>Compañía</Label>
              <Input v-model="formData.compania" placeholder="Iati, Chapka..." />
            </div>
            <div>
              <Label>Nº Póliza</Label>
              <Input v-model="formData.numero_poliza" />
            </div>
          </div>

          <div>
            <Label>Teléfono Asistencia</Label>
            <Input v-model="formData.telefono_urgencias" placeholder="+34 900..." />
          </div>

          <div class="grid grid-cols-3 gap-2">
             <div class="col-span-1">
               <Label>Precio</Label>
               <Input 
                 type="number" 
                 v-model="formData.precio" 
                 :step="formData.moneda === 'JPY' ? '1' : '0.01'"
               />
             </div>
             <div class="col-span-1">
               <Label>Moneda</Label>
               <Select v-model="formData.moneda">
                <SelectTrigger><SelectValue placeholder="EUR/JPY" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euros (€)</SelectItem>
                  <SelectItem value="JPY">Yenes (¥)</SelectItem>
                </SelectContent>
              </Select>
             </div>
             <div class="col-span-1">
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
            <Label>Notas / Coberturas</Label>
            <Textarea v-model="formData.notas" placeholder="Resumen de coberturas principales..." class="resize-none" />
          </div>

          <div v-if="formId" class="pt-4 border-t border-dashed mt-2">
            <div class="flex justify-between items-center mb-2">
              <Label>Archivos adjuntos</Label>
              <FileUploader collection="seguros" :item-id="formId" @uploaded="onFileUploaded" />
            </div>
            <FileList :files="formAdjuntos" collection="seguros" @deleted="onFileUploaded" />
          </div>
      </div>
      <DialogFooter>
        <Button @click="saveInsurance" :disabled="!isValid">Guardar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>