<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { useTripOrganization, type Seguro } from '~/composables/useTripOrganization'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  DrawerDescription 
} from '~/components/ui/drawer'
import { getLocalTimeZone, today, parseDate } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { useMediaQuery } from '@vueuse/core'
import { DateFormatter } from '@internationalized/date'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import FileUploader from '~/components/ui/FileUploader/FileUploader.vue'
import FileList from '~/components/ui/FileList/FileList.vue'
import { useDirectus } from '~/composables/useDirectus'
import { readItem } from '@directus/sdk'
import { RangeCalendar } from '~/components/ui/range-calendar'
import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'


const props = defineProps<{
  open: boolean
  tripId: string | number
  currentTrip?: any
  itemToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])

const { createSeguro, updateSeguro } = useTripOrganization()
const { getAuthenticatedClient } = useDirectus()

// Extend Seguro to include fields used in the UI but missing/different in the interface
type FormState = Omit<Partial<Seguro>, 'moneda'> & {
  moneda: 'EUR' | 'JPY'
  telefono_urgencias?: string
  notas?: string
}

// Initialize generic form logic
const { 
  formData, 
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm<FormState>(
  () => ({ 
    moneda: 'EUR', 
    estado_pago: 'pendiente',
    adjuntos: []
  } as FormState),
  createSeguro,
  updateSeguro,
  'Seguro'
)

// Sync open state
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const dateRange = ref({
  start: today(getLocalTimeZone()),
  end: today(getLocalTimeZone()).add({ days: 7 }),
}) as Ref<DateRange>

const isDesktop = useMediaQuery('(min-width: 768px)')
const numberOfMonths = computed(() => isDesktop.value ? 2 : 1)

// Watch for edit item changes
watch(() => props.itemToEdit, (newItem) => {
  if (newItem) {
    handleEdit(newItem)
    // Initialize dateRange from existing data
    if (newItem.fecha_inicio) {
      try {
        const start = parseDate(newItem.fecha_inicio)
        const end = newItem.fecha_fin ? parseDate(newItem.fecha_fin) : start
        dateRange.value = { start, end }
      } catch (e) {
        console.error('Error parsing dates:', e)
      }
    }
  } else {
    handleCreate()
    // Reset dateRange to default (today + 7 days)
    dateRange.value = {
      start: today(getLocalTimeZone()),
      end: today(getLocalTimeZone()).add({ days: 7 }),
    }
  }
}, { immediate: true })

// Sync dateRange changes to formData
watch(dateRange, (newRange) => {
  if (newRange?.start) {
    // @ts-ignore
    formData.value.fecha_inicio = newRange.start.toString()
    // @ts-ignore
    formData.value.fecha_fin = newRange.end ? newRange.end.toString() : newRange.start.toString()
  }
})


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
  <Drawer v-model:open="isOpen">
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4">
      <DrawerHeader class="w-full max-w-7xl mx-auto px-0">
        <DrawerTitle>{{ formData.id ? 'Editar Seguro' : 'Nuevo Seguro' }}</DrawerTitle>
        <DrawerDescription>Gestiona tu póliza y asistencia en viaje.</DrawerDescription>
      </DrawerHeader>
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row pr-4">
          <div class="w-full lg:w-2/3 space-y-4 py-4">  
            <div class="grid grid-cols-[2fr_1fr] gap-3">
              <div>
                <Label>Compañía</Label>
                <Input v-model="formData.compania" placeholder="Iati, Chapka..." />
              </div>
              <div>
                <Label>Nº Póliza</Label>
                <Input v-model="formData.numero_poliza" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Teléfono Asistencia</Label>
                <Input v-model="formData.telefono_urgencias" placeholder="+34 900..." />
              </div>
              <div>
                <Label>Email Asistencia</Label>
                <Input v-model="formData.email_urgencias" placeholder="email@example.com" />
              </div>
            </div>
            <div class="grid gap-2">
              <Label>Fechas</Label>
              <div class="flex justify-center bg-background">
                <RangeCalendar 
                  v-model="dateRange" 
                  class="rounded-md border border-input" 
                  locale="es-ES" 
                  :week-starts-on="1"
                  :number-of-months="numberOfMonths"
                />
              </div>
              <p class="text-xs text-muted-foreground text-center">
                Selecciona el día de inicio y el día de fin del seguro.
              </p>
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
          </div>
          <div class="w-full lg:w-1/3 space-y-8 py-4">
            <div v-if="formData.id" class="pb-8 border-b border-dashed">
              <div class="flex justify-between items-center mb-2">
                <Label>Archivos adjuntos</Label>
                <FileUploader collection="seguros" :item-id="formId" @uploaded="onFileUploaded" />
              </div>
              <FileList :files="formAdjuntos" collection="seguros" @deleted="onFileUploaded" />
            </div>
            <EntityTasksWidget 
              v-if="formData.id"
              :key="String(formData.id)"
              :trip-id="Number(props.tripId)"
              entity-type="insurance"
              :entity-id="String(formData.id)"
              :title="`Tareas: ${formData.compania || 'Seguro'}`"
            />
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button @click="saveInsurance" :disabled="!isValid">Guardar</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>