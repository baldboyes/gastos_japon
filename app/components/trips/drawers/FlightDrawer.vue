<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useTripOrganization, type Vuelo, type EscalaVuelo } from '~/composables/useTripOrganization'
import { useAirlines } from '~/composables/useAirlines'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { toast } from 'vue-sonner'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  DrawerDescription 
} from '~/components/ui/drawer'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import { Textarea } from '~/components/ui/textarea'
import AirlineSelector from '~/components/ui/AirlineSelector/AirlineSelector.vue'
import CurrencySelector from '~/components/ui/CurrencySelector/CurrencySelector.vue'
import FileUploader from '~/components/ui/FileUploader/FileUploader.vue'
import FileList from '~/components/ui/FileList/FileList.vue'
import { useDirectus } from '~/composables/useDirectus'
import { readItem } from '@directus/sdk'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'

const route = useRoute()
const tripId = route.params.id as string

const props = defineProps<{
  open: boolean
  tripId: string | number
  currentTrip?: any
  itemToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])
const { t } = useI18n()

const { createVuelo, updateVuelo } = useTripOrganization()
const { airlines, fetchAirlines } = useAirlines()
const { getAuthenticatedClient } = useDirectus()

const escalaRefs = ref<HTMLElement[]>([])

// Initialize generic form logic
const { 
  formData, 
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm<Partial<Vuelo>>(
  () => ({ 
    moneda: props.currentTrip?.moneda || 'JPY', 
    escalas: [] as EscalaVuelo[], 
    estado_pago: 'pendiente',
    titulo: '',
    codigo_reserva: '',
    adjuntos: []
  }),
  createVuelo,
  updateVuelo,
  String(t('trip_flight_drawer.item_label'))
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
  } else {
    handleCreate()
  }
}, { immediate: true })

watch(isOpen, (isOpened) => {
  if (isOpened && !props.itemToEdit) {
    handleCreate()
  }
})

// Fetch airlines if needed
watch(() => isOpen.value, (val) => {
  if (val && airlines.value.length === 0) {
    fetchAirlines()
  }
})

const saveFlight = () => {
  handleSave((data) => {
     // Validate at least one segment
     if (!data.escalas || data.escalas.length === 0) {
         toast.error(String(t('trip_flight_drawer.validation.need_one_segment')))
         throw new Error('Validation failed')
     }

     // Auto-calculate globals from segments
     const sorted = [...data.escalas].sort((a: any, b: any) => new Date(a.fecha_salida).getTime() - new Date(b.fecha_salida).getTime())
     
     data.origen = sorted[0].origen
     data.destino = sorted[sorted.length - 1].destino
     data.aerolinea = sorted[0].aerolinea

     // Default title if empty
     if (!data.titulo) {
         data.titulo = `${data.origen} ➝ ${data.destino}`
     }
     
     data.viaje_id = typeof props.tripId === 'string' ? parseInt(props.tripId) : props.tripId
     return data
  }, () => {
    emit('saved')
    emit('update:open', false)
  })
}

const addEscala = async () => {
  if (!formData.value.escalas) formData.value.escalas = []
  
  // Auto-fill logic based on previous segment
  let prevDest = ''
  let prevDate = ''
  if (formData.value.escalas.length > 0) {
      const last = formData.value.escalas[formData.value.escalas.length - 1]
      prevDest = last.destino || ''
      // Suggest next flight 2 hours later
      if (last.fecha_llegada) {
        try {
           const d = new Date(last.fecha_llegada)
           d.setHours(d.getHours() + 2)
           prevDate = d.toISOString().slice(0, 16)
        } catch(e) {}
      }
  }

  formData.value.escalas.push({ 
    origen: prevDest, 
    destino: '', 
    aerolinea: '', 
    numero_vuelo: '', 
    terminal_origen: '',
    terminal_destino: '',
    notas: '',
    fecha_salida: prevDate, 
    fecha_llegada: '' 
  })

  await nextTick()
  if (escalaRefs.value.length > 0) {
    const lastElement = escalaRefs.value[escalaRefs.value.length - 1]
    lastElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const deleteEscalaIndex = ref<number | null>(null)
const isDeleteEscalaOpen = ref(false)

const removeEscala = (index: number) => {
  deleteEscalaIndex.value = index
  isDeleteEscalaOpen.value = true
}

const confirmRemoveEscala = () => {
  if (deleteEscalaIndex.value !== null && formData.value.escalas) {
    formData.value.escalas.splice(deleteEscalaIndex.value, 1)
    deleteEscalaIndex.value = null
  }
  isDeleteEscalaOpen.value = false
}

const isValid = computed(() => {
  if (!formData.value.titulo) return false
  if (!formData.value.escalas || formData.value.escalas.length === 0) return false
  return formData.value.escalas.every((e: any) => e.origen && e.destino && e.fecha_salida)
})

const formId = computed(() => (formData.value as any).id)
const formAdjuntos = computed(() => (formData.value as any).adjuntos || [])

const onFileUploaded = async () => {
  // @ts-ignore
  if (!formData.value.id) return
  
  try {
    const client = await getAuthenticatedClient()
    // @ts-ignore
    const response = await client.request(readItem('vuelos', formData.value.id, {
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
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl">
      <DrawerHeader class="w-full max-w-7xl mx-auto px-4">
        <DrawerTitle>{{ formData.id ? $t('trip_flight_drawer.title.edit') : $t('trip_flight_drawer.title.new') }}</DrawerTitle>
      </DrawerHeader>
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row px-4">
          <div class="w-full lg:w-2/3 space-y-4 py-4">
            <div class="grid grid-cols-[2fr_1fr] gap-3">
              <div>
                <Label>{{ $t('trip_flight_drawer.fields.title') }}</Label>
                <Input v-model="formData.titulo" :placeholder="String($t('trip_flight_drawer.placeholders.title'))" class="font-medium" />
              </div>
              <div>
                <Label>{{ $t('trip_flight_drawer.fields.locator') }}</Label>
                <Input v-model="formData.codigo_reserva" :placeholder="String($t('trip_flight_drawer.placeholders.locator'))" class="font-mono uppercase" />
              </div>
            </div>
            <!-- Price -->
            <div class="grid grid-cols-[2fr_1fr_1fr] gap-3">
              <div>
                <Label>{{ $t('trip_flight_drawer.fields.total_price') }}</Label>
                <Input 
                  type="number" 
                  v-model="formData.precio" 
                  :step="formData.moneda === 'JPY' ? '1' : '0.01'" 
                />
              </div>
              <div>
                <Label>{{ $t('trip_flight_drawer.fields.currency') }}</Label>
                <CurrencySelector v-model="formData.moneda" />
              </div>
              <div>
                <Label>{{ $t('trip_flight_drawer.fields.status') }}</Label>
                <Select v-model="formData.estado_pago">
                  <SelectTrigger><SelectValue :placeholder="String($t('trip_flight_drawer.placeholders.status'))" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagado">{{ $t('trip_flight_drawer.status.paid') }}</SelectItem>
                    <SelectItem value="pendiente">{{ $t('trip_flight_drawer.status.pending') }}</SelectItem>
                    <SelectItem value="parcial">{{ $t('trip_flight_drawer.status.partial') }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <!-- Escalas Section -->
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <Label class="font-bold">{{ $t('trip_flight_drawer.segments.title') }}</Label>
                <Button size="sm" @click="addEscala"><Plus class="h-3 w-3" /> {{ $t('trip_flight_drawer.actions.add') }}</Button>
              </div>
              <div v-if="!formData.escalas || formData.escalas.length === 0" class="text-sm text-center py-6 border-2 border-dashed rounded-lg bg-slate-50 text-muted-foreground">
                <p>{{ $t('trip_flight_drawer.segments.empty.title') }}</p>
                <Button variant="link" size="sm" @click="addEscala">{{ $t('trip_flight_drawer.segments.empty.cta') }}</Button>
              </div>
              <div v-for="(escala, index) in formData.escalas" :key="index" ref="escalaRefs" class="p-4 rounded-lg relative bg-gray-50 shadow-sm">

                <div class="flex justify-between items-center pb-6">
                  <span class="font-bold text-sm text-slate-600 flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs">{{ index + 1 }}</div>
                    {{ $t('trip_flight_drawer.segments.item_title') }}
                  </span>
                  <Button @click="removeEscala(index)" variant="destructive" size="sm">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>

                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="gap-3 space-y-4">
                      <div class="grid grid-cols-[3fr_1fr] gap-3">
                        <div>
                          <Label>{{ $t('trip_flight_drawer.fields.origin') }}</Label>
                          <Input class="h-9" v-model="escala.origen" :placeholder="String($t('trip_flight_drawer.placeholders.origin'))" />
                        </div>
                        <div>
                          <Label>{{ $t('trip_flight_drawer.fields.terminal') }}</Label>
                          <Input class="h-9" v-model="escala.terminal_origen" :placeholder="String($t('trip_flight_drawer.placeholders.terminal'))" />
                        </div>
                      </div>
                      <div>
                        <Label>{{ $t('trip_flight_drawer.fields.departure') }}</Label>
                        <DateTimePicker 
                          v-model="escala.fecha_salida" 
                          :min="currentTrip?.fecha_inicio || undefined"
                          :max="currentTrip?.fecha_fin || undefined"
                          default-time="10:00"
                        />
                      </div>
                    </div>
                    <div class="gap-3 space-y-4">
                      <div class="grid grid-cols-[3fr_1fr] gap-3">
                        <div>
                          <Label>{{ $t('trip_flight_drawer.fields.destination') }}</Label>
                          <Input class="h-9" v-model="escala.destino" :placeholder="String($t('trip_flight_drawer.placeholders.destination'))" />
                        </div>
                        <div>
                          <Label>{{ $t('trip_flight_drawer.fields.terminal') }}</Label>
                          <Input class="h-9" v-model="escala.terminal_destino" :placeholder="String($t('trip_flight_drawer.placeholders.terminal'))" />
                        </div>
                      </div>
                      <div>
                        <Label>{{ $t('trip_flight_drawer.fields.arrival') }}</Label>
                        <DateTimePicker 
                          v-model="escala.fecha_llegada" 
                          :min="currentTrip?.fecha_inicio || undefined"
                          :max="currentTrip?.fecha_fin || undefined"
                          default-time="10:00"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-[3fr_1fr] gap-3">
                    <div>
                      <Label>{{ $t('trip_flight_drawer.fields.airline') }}</Label>
                      <AirlineSelector v-model="escala.aerolinea" />
                    </div>
                    <div>
                      <Label>{{ $t('trip_flight_drawer.fields.flight_number') }}</Label>
                      <Input class="h-9" v-model="escala.numero_vuelo" :placeholder="String($t('trip_flight_drawer.placeholders.flight_number'))" />
                    </div>
                  </div>
                  <div>
                    <Label>{{ $t('trip_flight_drawer.fields.notes') }}</Label>
                    <Textarea v-model="formData.notas" :placeholder="String($t('trip_flight_drawer.placeholders.notes'))" class="resize-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="w-full lg:w-1/3 space-y-8">
            <div v-if="formId" class="pb-8 border-b border-dashed">
              <div class="flex justify-between items-center mb-2">
                <Label>{{ $t('trip_flight_drawer.fields.attachments') }}</Label>
                <FileUploader collection="vuelos" :item-id="formId" @uploaded="onFileUploaded" />
              </div>
              <FileList :files="formAdjuntos" collection="vuelos" @deleted="onFileUploaded" />
            </div>
            <EntityTasksWidget 
              v-if="formId"
              :key="formId"
              :trip-id="Number(props.tripId)"
              entity-type="flight"
              :entity-id="String(formId)"
              :title="`${$t('trip_flight_drawer.tasks.title_prefix')}: ${formData.titulo || $t('trip_flight_drawer.tasks.entity_fallback')}`"
            />
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button @click="saveFlight" :disabled="!isValid">{{ $t('trip_flight_drawer.actions.save') }}</Button>
      </DrawerFooter>
    </DrawerContent>

    <AlertDialog v-model:open="isDeleteEscalaOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('trip_flight_drawer.delete_segment.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ $t('trip_flight_drawer.delete_segment.description') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteEscalaIndex = null">{{ $t('trip_flight_drawer.delete_segment.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="confirmRemoveEscala" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">{{ $t('trip_flight_drawer.delete_segment.confirm') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
  </Drawer>
</template>
