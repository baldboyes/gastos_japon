<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTripOrganization, type Actividad } from '~/composables/useTripOrganization'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  DrawerDescription 
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import LocationSelector from '~/components/ui/LocationSelector/LocationSelector.vue'
import CurrencySelector from '~/components/ui/CurrencySelector/CurrencySelector.vue'
import FileUploader from '~/components/ui/FileUploader/FileUploader.vue'
import FileList from '~/components/ui/FileList/FileList.vue'
import { useDirectus } from '~/composables/useDirectus'
import { readItem } from '@directus/sdk'
import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'

const props = defineProps<{
  open: boolean
  tripId: string | number
  currentTrip?: any
  itemToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])
const { t } = useI18n()

const { createActividad, updateActividad } = useTripOrganization()
const { getAuthenticatedClient } = useDirectus()

type FormState = Omit<Partial<Actividad>, 'moneda'> & {
  moneda: string
}

// Initialize generic form logic
const { 
  formData, 
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm<FormState>(
  () => ({ 
    moneda: props.currentTrip?.moneda || 'JPY', 
    precio: 0, 
    estado_pago: 'pendiente', 
    notas: '', 
    ubicacion: { address: '', latitude: 0, longitude: 0, city: '', prefecture: '' },
    adjuntos: []
  } as FormState),
  createActividad,
  updateActividad,
  String(t('trip_activity_drawer.item_label'))
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

watch(isOpen, (isOpened) => {
  if (isOpened && !props.itemToEdit) {
    handleCreate()
  }
})

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
  <Drawer v-model:open="isOpen">
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4">
      <DrawerHeader class="w-full max-w-7xl mx-auto px-0">
        <DrawerTitle>{{ formData.id ? $t('trip_activity_drawer.title.edit') : $t('trip_activity_drawer.title.new') }}</DrawerTitle>
        <DrawerDescription>{{ $t('trip_activity_drawer.description') }}</DrawerDescription>
      </DrawerHeader>
      
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row pr-4">
          <div class="w-full lg:w-2/3 space-y-4 py-4">  
            <div>
              <Label>{{ $t('trip_activity_drawer.fields.name') }}</Label>
              <Input v-model="formData.nombre" :placeholder="String($t('trip_activity_drawer.placeholders.name'))" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <Label>{{ $t('trip_activity_drawer.fields.start') }}</Label>
                <DateTimePicker 
                  v-model="formData.fecha_inicio" 
                  :min="currentTrip?.fecha_inicio || undefined"
                  :max="currentTrip?.fecha_fin || undefined"
                  default-time="10:00"
                />
              </div>
              <div>
                <Label>{{ $t('trip_activity_drawer.fields.end') }}</Label>
                <DateTimePicker 
                  v-model="formData.fecha_fin" 
                  :min="currentTrip?.fecha_inicio || undefined"
                  :max="currentTrip?.fecha_fin || undefined"
                  default-time="12:00"
                />
              </div>
            </div>
            <div>
              <Label>{{ $t('trip_activity_drawer.fields.location') }}</Label>
              <LocationSelector 
                v-model="formData.ubicacion" 
                :placeholder="String($t('trip_activity_drawer.placeholders.location'))"
              />
            </div>
            <div class="grid grid-cols-[2fr_1fr_1fr] gap-3">
              <div>
                <Label>{{ $t('trip_activity_drawer.fields.total_price') }}</Label>
                <Input 
                  type="number" 
                  v-model="formData.precio" 
                  :step="formData.moneda === 'JPY' ? '1' : '0.01'" 
                />
              </div>
              <div>
                <Label>{{ $t('trip_activity_drawer.fields.currency') }}</Label>
                <CurrencySelector v-model="formData.moneda" />
              </div>
              <div>
                <Label>{{ $t('trip_activity_drawer.fields.status') }}</Label>
                <Select v-model="formData.estado_pago">
                  <SelectTrigger><SelectValue :placeholder="String($t('trip_activity_drawer.placeholders.status'))" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagado">{{ $t('trip_activity_drawer.status.paid') }}</SelectItem>
                    <SelectItem value="pendiente">{{ $t('trip_activity_drawer.status.pending') }}</SelectItem>
                    <SelectItem value="parcial">{{ $t('trip_activity_drawer.status.partial') }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{{ $t('trip_activity_drawer.fields.google_maps_link') }}</Label>
              <Input v-model="formData.enlace_google" :placeholder="String($t('trip_activity_drawer.placeholders.google_maps_link'))" />
            </div>
            <div>
              <Label>{{ $t('trip_activity_drawer.fields.notes') }}</Label>
              <Textarea v-model="formData.notas" :placeholder="String($t('trip_activity_drawer.placeholders.notes'))" class="resize-none" />
            </div>
          </div>
          <div class="w-full lg:w-1/3 space-y-8 py-4">
            <div v-if="formData.id" class="pb-8 border-b border-dashed">
              <div class="flex justify-between items-center mb-2">
                <Label>{{ $t('trip_activity_drawer.fields.attachments') }}</Label>
                <FileUploader collection="actividades" :item-id="formId" @uploaded="onFileUploaded" />
              </div>
              <FileList :files="formAdjuntos" collection="actividades" @deleted="onFileUploaded" />
            </div>
            <EntityTasksWidget 
              v-if="formData.id"
              :key="String(formData.id)"
              :trip-id="Number(props.tripId)"
              entity-type="activity"
              :entity-id="String(formData.id)"
              :title="`${$t('trip_activity_drawer.tasks.title_prefix')}: ${formData.nombre || $t('trip_activity_drawer.tasks.entity_fallback')}`"
            />
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button @click="saveActivity" :disabled="!isValid">{{ $t('trip_activity_drawer.actions.save') }}</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
