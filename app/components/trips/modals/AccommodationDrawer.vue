<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTripOrganization, type Alojamiento } from '~/composables/useTripOrganization'
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
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import LocationSelector from '~/components/ui/LocationSelector/LocationSelector.vue'
import FileUploader from '~/components/ui/FileUploader/FileUploader.vue'
import FileList from '~/components/ui/FileList/FileList.vue'
import { useDirectus } from '~/composables/useDirectus'
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

const props = defineProps<{
  open: boolean
  tripId: string | number
  currentTrip?: any
  itemToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])

const { createAlojamiento, updateAlojamiento } = useTripOrganization()
const { getAuthenticatedClient } = useDirectus()

type FormState = {
  id?: number
  viaje_id?: number
  nombre?: string
  moneda: 'EUR' | 'JPY'
  precio?: number
  estado_pago?: 'pagado' | 'pendiente' | 'parcial'
  notas?: string
  ubicacion: {
    address?: string
    latitude: number | undefined
    longitude: number | undefined
    city: string
    prefecture: string
  }
  pension: string[] | null
  privado: boolean
  takkyubin: boolean
  telefono?: string
  email?: string
  enlace_google?: string
  fecha_entrada?: string
  fecha_salida?: string
  adjuntos?: any[]
}

// Initialize generic form logic
const { 
  formData, 
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm<FormState>(
  () => ({ 
    moneda: 'JPY', 
    precio: 0, 
    estado_pago: 'pendiente', 
    notas: '', 
    ubicacion: { address: '', city: '', prefecture: '', latitude: 0, longitude: 0 },
    pension: [],
    privado: false,
    takkyubin: false,
    telefono: '',
    email: '',
    enlace_google: ''
  } as FormState),
  createAlojamiento,
  updateAlojamiento,
  'Alojamiento'
)

const pensionOptions = [
  { value: 'desayuno', label: 'Desayuno' },
  { value: 'comida', label: 'Comida' },
  { value: 'cena', label: 'Cena' },
  { value: 'completa', label: 'Pensión Completa' },
]

const updatePension = (value: string, event: Event) => {
  const isChecked = (event.target as HTMLInputElement).checked
  const current = new Set(formData.value.pension || [])
  
  if (isChecked) {
    current.add(value)
  } else {
    current.delete(value)
  }
  
  formData.value.pension = Array.from(current)
}

// Sync open state
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

// Watch for edit item changes
watch(() => props.itemToEdit, (newItem) => {
  if (newItem) {
    handleEdit(newItem)
    // Ensure pension is array if null from DB
    if (!formData.value.pension) {
      formData.value.pension = []
    }
  } else {
    handleCreate()
  }
}, { immediate: true })

const saveAccommodation = () => {
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
  if (!formData.value.fecha_entrada) return false
  if (!formData.value.fecha_salida) return false
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
    const response = await client.request(readItem('alojamientos', formData.value.id, {
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
        <DrawerTitle>{{ formData.id ? 'Editar Alojamiento' : 'Nuevo Alojamiento' }}</DrawerTitle>
        <DrawerDescription>Gestiona los detalles de tu alojamiento.</DrawerDescription>
      </DrawerHeader>
      
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pr-4 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row pr-4">
          <div class="w-full lg:w-2/3 space-y-4 py-4">
            <div>
              <Label>Nombre del Alojamiento</Label>
              <Input v-model="formData.nombre" placeholder="Hotel / Apartamento" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <Label>Entrada</Label>
                <DateTimePicker 
                  v-model="formData.fecha_entrada" 
                  :min="currentTrip?.fecha_inicio || undefined"
                  :max="currentTrip?.fecha_fin || undefined"
                  default-time="15:00"
                />
              </div>
              <div>
                <Label>Salida</Label>
                <DateTimePicker 
                  v-model="formData.fecha_salida" 
                  :min="currentTrip?.fecha_inicio || undefined"
                  :max="currentTrip?.fecha_fin || undefined"
                  default-time="11:00"
                />
              </div>
            </div>
            <div>
              <Label>Ubicación / Dirección</Label>
              <LocationSelector 
                v-model="formData.ubicacion" 
                placeholder="Buscar dirección..."
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
              <Label>Enlace de Google Maps</Label>
              <Input v-model="formData.enlace_google" placeholder="Enlace de Google Maps" />
            </div>
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2">
                <Switch v-model="formData.privado" id="privado" />
                <Label htmlFor="privado">Privado</Label>
              </div>
              <div class="flex items-center gap-2">
                <Switch v-model="formData.takkyubin" id="takkyubin" />
                <Label htmlFor="takkyubin">Takkyubin</Label>
              </div>
            </div>
            <div>
              <Label>Telefono</Label>
              <Input v-model="formData.telefono" placeholder="Número de teléfono" />
            </div>
            <div>
              <Label>Email</Label>
              <Input v-model="formData.email" placeholder="Correo electrónico" />
            </div>
            <div>
              <Label class="mb-2 block">Pensión</Label>
              <div class="flex flex-wrap gap-4">
                <div v-for="opt in pensionOptions" :key="opt.value" class="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    :id="`pension-native-${opt.value}`"
                    :checked="(formData.pension || []).includes(opt.value)"
                    @change="updatePension(opt.value, $event)"
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label :for="`pension-native-${opt.value}`" class="cursor-pointer">{{ opt.label }}</Label>
                </div>
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea v-model="formData.notas" placeholder="Información relevante, códigos de acceso, etc." class="resize-none" />
            </div>
          </div>
          <div class="w-full lg:w-1/3 space-y-8 py-4">
            <div v-if="formId" class="pb-8 border-b border-dashed">
              <div class="flex justify-between items-center mb-2">
                <Label>Archivos adjuntos</Label>
                <FileUploader collection="alojamientos" :item-id="formId" @uploaded="onFileUploaded" />
              </div>
              <FileList :files="formAdjuntos" collection="alojamientos" @deleted="onFileUploaded" />
            </div>
            <EntityTasksWidget 
              v-if="formId"
              :key="formId"
              :trip-id="Number(props.tripId)"
              entity-type="accommodation"
              :entity-id="String(formId)"
              :title="`Tareas: ${formData.nombre || 'Alojamiento'}`"
            />
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button @click="saveAccommodation" :disabled="!isValid">Guardar</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
