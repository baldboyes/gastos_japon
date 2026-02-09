<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { addDays, addHours, formatDateTime, formatDate } from '~/utils/dates'
import { differenceInDays, differenceInHours } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { DateTimePicker } from '~/components/ui/date-time-picker'
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

const { createTransporte, updateTransporte } = useTripOrganization()
const { getAuthenticatedClient } = useDirectus()

// Initialize generic form logic
const { 
  formData, 
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ 
    moneda: 'JPY', 
    categoria: 'trayecto', 
    escalas: [], 
    precio: 0, 
    estado_pago: 'pendiente', 
    tipo_duracion: 'dias',
    duracion_cantidad: 1 
  }),
  createTransporte,
  updateTransporte,
  'Transporte'
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
    if (!formData.value.escalas) formData.value.escalas = []
    
    // Calculate duration if editing a pass
    if (newItem.categoria === 'pase' && newItem.fecha_inicio && newItem.fecha_fin) {
        if (newItem.tipo_duracion === 'horas') {
           formData.value.duracion_cantidad = differenceInHours(new Date(newItem.fecha_fin), new Date(newItem.fecha_inicio))
        } else {
           formData.value.duracion_cantidad = differenceInDays(new Date(newItem.fecha_fin), new Date(newItem.fecha_inicio)) + 1
        }
    }
  } else {
    handleCreate()
  }
}, { immediate: true })

// Watch for changes to calculate End Date
watch([() => formData.value.fecha_inicio, () => formData.value.duracion_cantidad, () => formData.value.tipo_duracion], () => {
  if (formData.value.categoria !== 'pase') return
  if (!formData.value.fecha_inicio) return

  const amount = Number(formData.value.duracion_cantidad || 0)
  if (amount <= 0) return

  if (formData.value.tipo_duracion === 'horas') {
     formData.value.fecha_fin = addHours(formData.value.fecha_inicio, amount)
  } else {
     const daysToAdd = Math.max(0, amount - 1)
     formData.value.fecha_fin = addDays(formData.value.fecha_inicio, daysToAdd)
  }
})

const saveTransport = () => {
  handleSave((data) => {
    // Remove UI-only field
    delete data.duracion_cantidad

    // Logic to set start/end dates based on segments if it's a journey
    if (data.categoria === 'trayecto' && data.escalas?.length > 0) {
       const sorted = [...data.escalas].sort((a: any, b: any) => new Date(a.fecha_salida).getTime() - new Date(b.fecha_salida).getTime())
       data.fecha_inicio = sorted[0].fecha_salida
       data.fecha_fin = sorted[sorted.length - 1].fecha_llegada
       data.origen = sorted[0].origen
       data.destino = sorted[sorted.length - 1].destino
       data.medio = sorted[0].medio
    }

    // Default title if empty
    if (!data.titulo) {
       if (data.categoria === 'pase') {
          data.titulo = `Pase de Transporte`
       } else {
          data.titulo = `${data.origen || 'Origen'} ➝ ${data.destino || 'Destino'}`
       }
    }
    
    data.viaje_id = typeof props.tripId === 'string' ? parseInt(props.tripId) : props.tripId
    return data
  }, () => {
    emit('saved')
    emit('update:open', false)
  })
}

const isValid = computed(() => {
  // if (!formData.value.titulo) return false
  if (formData.value.categoria === 'pase') {
     return formData.value.fecha_inicio && formData.value.fecha_fin
  }
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
    const response = await client.request(readItem('transportes', formData.value.id, {
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
        <DialogTitle>{{ formData.id ? 'Editar Transporte' : 'Nuevo Transporte' }}</DialogTitle>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
          <div>
            <Label>Título / Nombre</Label>
            <Input v-model="formData.titulo" placeholder="Ej: JR Pass, Shinkansen a Kyoto..." />
          </div>

          <div>
            <Label>Categoría</Label>
            <div class="flex gap-2">
              <Select v-model="formData.categoria" class="flex-1">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pase">Pase (Periodo)</SelectItem>
                  <SelectItem value="trayecto">Trayecto (Ruta)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select v-if="formData.categoria === 'pase'" v-model="formData.tipo_duracion" class="w-32">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dias">Por Días</SelectItem>
                  <SelectItem value="horas">Por Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- PASE -->
          <template v-if="formData.categoria === 'pase'">
             <div class="grid grid-cols-2 gap-2">
                <div>
                  <Label>Inicio Validez</Label>
                  <DateTimePicker 
                    v-model="formData.fecha_inicio"
                    :min="currentTrip?.fecha_inicio || undefined"
                    :max="currentTrip?.fecha_fin || undefined"
                    :default-time="formData.tipo_duracion === 'horas' ? '10:00' : undefined"
                    :hide-time="formData.tipo_duracion !== 'horas'"
                  />
                </div>
                <div>
                  <Label>Duración ({{ formData.tipo_duracion === 'horas' ? 'Horas' : 'Días' }})</Label>
                  <Input 
                    type="number" 
                    v-model="formData.duracion_cantidad" 
                    min="1"
                    class="h-10"
                  />
                  <p class="text-[10px] text-muted-foreground mt-1 text-right">
                    Fin: {{ formData.fecha_fin ? (formData.tipo_duracion === 'horas' ? formatDateTime(formData.fecha_fin) : formatDate(formData.fecha_fin)) : '-' }}
                  </p>
                </div>
             </div>
          </template>

          <!-- TRAYECTO -->
          <template v-else>
             <div class="grid grid-cols-2 gap-2">
                <div>
                  <Label>Salida</Label>
                  <DateTimePicker 
                    v-model="formData.fecha_inicio"
                    :min="currentTrip?.fecha_inicio || undefined"
                    :max="currentTrip?.fecha_fin || undefined"
                    default-time="10:00"
                  />
                </div>
                <div>
                  <Label>Llegada</Label>
                  <DateTimePicker 
                    v-model="formData.fecha_fin"
                    :min="currentTrip?.fecha_inicio || undefined"
                    :max="currentTrip?.fecha_fin || undefined"
                    default-time="12:00"
                  />
                </div>
             </div>
             <div class="grid grid-cols-2 gap-2">
               <div><Label>Origen</Label><Input v-model="formData.origen" /></div>
               <div><Label>Destino</Label><Input v-model="formData.destino" /></div>
             </div>
             <div>
               <Label>Medio de Transporte</Label>
               <Select v-model="formData.medio">
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tren">Tren / Shinkansen</SelectItem>
                    <SelectItem value="bus">Autobús</SelectItem>
                    <SelectItem value="metro">Metro</SelectItem>
                    <SelectItem value="taxi">Taxi</SelectItem>
                    <SelectItem value="barco">Ferry / Barco</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
               </Select>
             </div>
          </template>

          <!-- Price & Status -->
          <div class="grid grid-cols-3 gap-2">
             <div :class="{ 'opacity-50 pointer-events-none': formData.pase_id && formData.pase_id !== 'none' }">
               <Label>Precio</Label>
               <Input 
                 type="number" 
                 v-model="formData.precio" 
                 :step="formData.moneda === 'JPY' ? '1' : '0.01'"
                 :disabled="!!formData.pase_id && formData.pase_id !== 'none'"
               />
             </div>
             <div>
               <Label>Moneda</Label>
               <Select v-model="formData.moneda" :disabled="!!formData.pase_id && formData.pase_id !== 'none'">
                <SelectTrigger><SelectValue placeholder="EUR/JPY" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euros (€)</SelectItem>
                  <SelectItem value="JPY">Yenes (¥)</SelectItem>
                </SelectContent>
              </Select>
             </div>
             <div :class="{ 'opacity-50 pointer-events-none': formData.pase_id && formData.pase_id !== 'none' }">
               <Label>Estado</Label>
               <Select v-model="formData.estado_pago" :disabled="!!formData.pase_id && formData.pase_id !== 'none'">
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
            <Label>Notas</Label>
            <Textarea v-model="formData.notas" placeholder="Instrucciones, andén, etc." class="resize-none" />
          </div>

          <div v-if="formId" class="pt-4 border-t border-dashed mt-2">
            <div class="flex justify-between items-center mb-2">
              <Label>Archivos adjuntos</Label>
              <FileUploader collection="transportes" :item-id="formId" @uploaded="onFileUploaded" />
            </div>
            <FileList :files="formAdjuntos" collection="transportes" @deleted="onFileUploaded" />
          </div>
      </div>
      <DialogFooter>
        <Button @click="saveTransport" :disabled="!isValid">Guardar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>