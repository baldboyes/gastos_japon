<script setup lang="ts">
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { getLocalTimeZone, today, parseDate, type CalendarDate } from '@internationalized/date'
import { useMediaQuery } from '@vueuse/core'
import { DateFormatter } from '@internationalized/date'
import { 
  Loader2, 
  Trash2,
  Upload,
  Calendar as CalendarIcon
} from 'lucide-vue-next'

import { useDirectus } from '~/composables/useDirectus'
import { readUser } from '@directus/sdk'
import { fileUrl } from '~/utils/directusFiles'
import { useDirectusFiles } from '~/composables/useDirectusFiles'
import SecureImage from '~/components/ui/SecureImage.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import { CurrencySelector } from '~/components/ui/CurrencySelector'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  DrawerDescription 
} from '~/components/ui/drawer'

const props = defineProps<{
  open: boolean
  tripToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])

const { createTrip, updateTrip, loading } = useTrips()
const { uploadFile } = useDirectusFiles()
const { getAuthenticatedClient, directusUserId } = useDirectus()

// Estado
const uploadingCover = ref(false)
const isEditing = computed(() => !!props.tripToEdit)
const defaultCurrency = ref('')
const loadingPreference = ref(false)

// Fetch user preference
const fetchUserPreference = async () => {
  if (loadingPreference.value) return
  
  try {
    loadingPreference.value = true
    const client = await getAuthenticatedClient()
    
    if (!directusUserId.value) {
      console.warn('No Directus User ID found')
      return
    }

    const userData = await client.request(readUser(directusUserId.value, {
      fields: ['moneda']
    }))
    
    if (userData && userData.moneda) {
      defaultCurrency.value = userData.moneda
      // If we are in create mode, update the form immediately
      if (!props.tripToEdit) {
        formData.value.moneda = userData.moneda
      }
    }
  } catch (e) {
    console.error('Error fetching user preference:', e)
  } finally {
    loadingPreference.value = false
  }
}

// Formulario
const formData = ref<{
  nombre: string
  portada: string | null
  presupuesto_diario: number | undefined
  moneda: string
}>({
  nombre: '',
  portada: null,
  presupuesto_diario: undefined,
  moneda: '',
})

// Fechas
const startDate = ref<any>(today(getLocalTimeZone()))
const endDate = ref<any>(today(getLocalTimeZone()).add({ days: 7 }))

const df = new DateFormatter('es-ES', {
  dateStyle: 'long'
})

// Sync start/end dates
watch(startDate, (newVal) => {
  if (endDate.value && newVal && newVal.compare(endDate.value) > 0) {
    endDate.value = newVal
  }
})

const isDesktop = useMediaQuery('(min-width: 768px)')
const numberOfMonths = computed(() => isDesktop.value ? 2 : 1)

onMounted(() => {
  fetchUserPreference()
})

// Sync open state
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

// Fetch preference when drawer opens for new trip
watch(() => props.open, (isOpen) => {
  if (isOpen && !props.tripToEdit) {
    fetchUserPreference()
  }
})

// Watch changes in tripToEdit
watch(() => props.tripToEdit, (trip) => {
  if (trip) {
    formData.value.nombre = trip.nombre
    formData.value.portada = trip.portada
    formData.value.presupuesto_diario = trip.presupuesto_diario
    formData.value.moneda = trip.moneda
    
    try {
      if (trip.fecha_inicio) {
        startDate.value = parseDate(trip.fecha_inicio)
        endDate.value = trip.fecha_fin ? parseDate(trip.fecha_fin) : startDate.value
      } else {
         startDate.value = today(getLocalTimeZone())
         endDate.value = today(getLocalTimeZone()).add({ days: 7 })
      }
    } catch (e) {
      console.error("Error parsing dates for calendar:", e)
      startDate.value = today(getLocalTimeZone())
      endDate.value = today(getLocalTimeZone()).add({ days: 7 })
    }
  } else {
    // Reset form for create
    formData.value.nombre = ''
    formData.value.portada = null
    formData.value.presupuesto_diario = undefined
    formData.value.moneda = defaultCurrency.value
    startDate.value = today(getLocalTimeZone())
    endDate.value = today(getLocalTimeZone()).add({ days: 7 })
  }
}, { immediate: true })


const handleCoverUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  if (!file) return

  // Validación básica 10MB
  if (file.size > 10 * 1024 * 1024) {
    console.error('La imagen supera los 10MB')
    return
  }

  uploadingCover.value = true
  try {
    const fileId = await uploadFile(file)
    formData.value.portada = fileId
  } catch (e) {
    console.error('Error uploading cover:', e)
  } finally {
    uploadingCover.value = false
    input.value = ''
  }
}

const handleSubmit = async () => {
  if (!formData.value.nombre || !startDate.value) return

  const tripData = {
    nombre: formData.value.nombre,
    portada: formData.value.portada,
    presupuesto_diario: formData.value.presupuesto_diario,
    moneda: formData.value.moneda,
    fecha_inicio: startDate.value.toString(),
    fecha_fin: endDate.value?.toString() || startDate.value.toString()
  }

  try {
    if (isEditing.value && props.tripToEdit?.id) {
      await updateTrip(props.tripToEdit.id, tripData)
    } else {
      await createTrip(tripData)
    }
    emit('saved')
    isOpen.value = false
  } catch (e) {
    // Error handled in composable
  }
}
</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4">
      <DrawerHeader class="w-full max-w-7xl mx-auto px-0">
        <DrawerTitle>{{ isEditing ? 'Editar Viaje' : 'Crear Nuevo Viaje' }}</DrawerTitle>
      </DrawerHeader>
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row pr-4">
          <div class="grid gap-4 py-4 max-w-3xl mx-auto">
            <div class="grid gap-2">
              <Label htmlFor="name">Nombre del Viaje</Label>
              <Input id="name" v-model="formData.nombre" placeholder="Ej: Japón 2026" />
            </div>
            <div class="grid gap-2">
              <Label>Fechas</Label>
              <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex flex-col gap-2 w-full">
                  <Label class="text-xs text-muted-foreground">Inicio</Label>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        variant="outline"
                        :class="cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )"
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{ startDate ? df.format(startDate.toDate(getLocalTimeZone())) : "Seleccionar fecha" }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0">
                      <Calendar v-model="startDate" initial-focus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div class="flex flex-col gap-2 w-full">
                  <Label class="text-xs text-muted-foreground">Fin</Label>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        variant="outline"
                        :class="cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )"
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{ endDate ? df.format(endDate.toDate(getLocalTimeZone())) : "Seleccionar fecha" }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0">
                      <Calendar 
                        v-model="endDate" 
                        initial-focus 
                        :min-value="startDate"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="w-full">
                <Label htmlFor="presupuesto">Presupuesto diario</Label>
                <Input id="presupuesto" v-model="formData.presupuesto_diario" type="number" placeholder="Ej: 10000" />
              </div>
              <div class="w-full">
                <div class="flex items-center gap-2 mb-2">
                  <Label htmlFor="moneda">Moneda</Label>
                  <Loader2 v-if="loadingPreference" class="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
                <CurrencySelector v-model="formData.moneda" />
              </div>
            </div>
            <div class="grid gap-2">
              <Label>Portada</Label>
              <div v-if="formData.portada" class="relative aspect-video rounded-md overflow-hidden border group">
                <SecureImage :src="formData.portada" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    @click="formData.portada = null"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
              <div v-else class="flex items-center justify-center w-full">
                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <Loader2 v-if="uploadingCover" class="h-8 w-8 text-muted-foreground animate-spin" />
                    <template v-else>
                        <Upload class="w-8 h-8 mb-2 text-muted-foreground" />
                        <p class="text-sm text-muted-foreground font-medium">Click para subir portada</p>
                        <p class="text-xs text-muted-foreground">PNG, JPG (Max. 10MB)</p>
                    </template>
                  </div>
                  <input type="file" class="hidden" accept="image/png, image/jpeg, image/jpg" @change="handleCoverUpload" :disabled="uploadingCover" />
                </label>
              </div>
            </div>
          </div>
          <div class="w-full lg:w-1/3 space-y-8">
            aaaaaa
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button type="submit" @click="handleSubmit" :disabled="loading">
          {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Viaje') }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>