<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl">
      <DrawerHeader class="w-full max-w-7xl mx-auto px-4">
        <DrawerTitle>{{ isEditMode ? 'Editar Gasto' : 'Nuevo Gasto' }}</DrawerTitle>
      </DrawerHeader>

      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row px-4">
          <!-- Left Column: Form -->
          <div class="w-full lg:w-2/3 space-y-4 py-4">
            <form id="expense-form" @submit.prevent="handleSubmit" class="space-y-4">
              <div class="flex items-start justify-between gap-4">
                <div class="w-3/4 space-y-4">
                  <!-- Amount -->
                  <div>
                    <Label for="amount" class="text-base">Gasto ({{ currencySymbol }}) *</Label>
                    <div class="relative mt-2">
                      <span class="absolute left-2 top-4 text-lg text-gray-600">{{ currencySymbol }}</span>
                      <Input
                        id="amount"
                        v-model="form.amount"
                        type="number"
                        inputmode="decimal"
                        placeholder="1,200"
                        class="pl-6 text-xl h-14 bg-white"
                        required
                        step="1"
                        min="1"
                      />
                    </div>
                  </div>
                  <!-- Place Name -->
                  <div>
                    <Label for="placeName" class="text-base">Nombre del Lugar *</Label>
                    <Input
                      id="placeName"
                      v-model="form.placeName"
                      type="text"
                      placeholder="Ej: Ichiran Ramen"
                      class="mt-2 h-14 text-xl bg-white"
                      required
                    />
                  </div>
                </div>

                <!-- Payment Method -->
                <div class="w-1/4">
                  <Label class="text-base mb-3 block">Pago *</Label>
                  <div class="flex flex-col items-center gap-2 w-full justify-between -mt-1">
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center gap-0 p-0 rounded-lg border-2 transition-all h-12 w-full"
                      :class="[
                        form.paymentMethod === 'cash'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      ]"
                      @click="form.paymentMethod = 'cash'"
                    >
                      <span class="text-2xl">💴</span>
                    </button>
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center gap-0 p-0 rounded-lg border-2 transition-all h-12 w-full"
                      :class="[
                        form.paymentMethod === 'card'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      ]"
                      @click="form.paymentMethod = 'card'"
                    >
                      <span class="text-2xl">💳</span>
                    </button>
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center gap-0 p-0 rounded-lg border-2 transition-all h-12 w-full"
                      :class="[
                        form.paymentMethod === 'ic'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      ]"
                      @click="form.paymentMethod = 'ic'"
                    >
                      <img src="/ic.webp" alt="IC" class="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Category -->
              <CategorySelector :model-value="form.category" @update:model-value="form.category = $event" />

              <!-- Date and Time -->
              <div class="w-full">
                <Label for="date" class="text-base mb-2 block">Fecha y Hora *</Label>
                <DateTimePicker 
                  v-model="form.date" 
                  class="w-full"
                />
              </div>

              <!-- Location -->
              <div>
                <Label class="text-base mb-2 block">Ubicación *</Label>
                <Card>
                  <CardContent class="py-0 px-4 space-y-2">
                    <button
                      v-if="!locationCaptured && !isEditMode"
                      type="button"
                      class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      @click="showMapEditor = true"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>Seleccionar ubicación en el mapa</span>
                    </button>

                    <div v-if="locationCaptured || isEditMode" class="space-y-3">
                      <div class="flex items-start gap-2 text-sm text-gray-700 bg-red-50 p-3 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 text-red-600">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="m9 12 2 2 4-4"/>
                        </svg>
                        <div>
                          <div class="font-medium">{{ form.location.city || 'Sin ubicación' }}</div>
                          <div class="text-xs text-gray-600">{{ form.location.prefecture || 'Sin prefectura' }}</div>
                        </div>
                      </div>

                      <div class="flex gap-2">
                        <button
                          type="button"
                          class="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                          @click="showMapEditor = true"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          Cambiar ubicación
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <!-- Notes -->
              <div>
                <Label for="notes" class="text-base">Notas</Label>
                <Textarea
                  id="notes"
                  v-model="form.notes"
                  placeholder="Agrega detalles adicionales sobre este gasto..."
                  class="mt-2 min-h-[100px] bg-white"
                />
              </div>

              <!-- Shared -->
              <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer" @click="toggleShared">
                <div
                  class="size-4 shrink-0 rounded-[4px] border shadow-xs transition-all flex items-center justify-center"
                  :class="form.shared ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'"
                >
                  <svg
                    v-if="form.shared"
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <Label class="text-base cursor-pointer flex items-center gap-2 pointer-events-none select-none">
                  <span>⭐</span>
                  <span>Gasto destacado</span>
                </Label>
              </div>
            </form>
          </div>

          <!-- Right Column: Image Placeholder -->
          <div class="w-full lg:w-1/3 space-y-8 py-4">
             <div class="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-500 h-full flex items-center justify-center">
               <div class="space-y-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-gray-400">
                   <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                   <circle cx="9" cy="9" r="2"/>
                   <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                 </svg>
                 <p>Zona para subir imágenes<br>(Próximamente)</p>
               </div>
             </div>
          </div>
        </div>
      </ScrollArea>

      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <div class="flex gap-3 w-full">
          <Button
            v-if="!isEditMode"
            type="button"
            variant="outline"
            class="w-1/3 h-14"
            @click="handleSavePlanned"
            :disabled="!isFormValid || isSubmitting"
          >
            Previsto
          </Button>
          <Button
            type="button"
            class="flex-1 bg-red-600 hover:from-red-600 hover:to-red-700 h-14"
            :disabled="!isFormValid || isSubmitting"
            @click="handleSubmit"
          >
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Añadir') }}
          </Button>
        </div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <!-- Map Editor Dialog (Using standard Dialog as it might work better for full screen map) -->
  <Dialog v-model:open="showMapEditor">
    <DialogContent class="max-w-4xl h-[85vh] flex flex-col p-0">
      <DialogHeader class="px-6 pt-6 pb-4 shrink-0">
        <DialogTitle>Editar ubicación en el Mapa</DialogTitle>
        <DialogDescription>
          Toca en el mapa para cambiar la ubicación del gasto
        </DialogDescription>
      </DialogHeader>
      <div class="flex-1 px-6 min-h-0">
        <MapsEditable
          :latitude="form.location.coordinates.lat"
          :longitude="form.location.coordinates.lng"
          @location-change="handleLocationChange"
        />
      </div>
      <DialogFooter class="px-6 pb-6 pt-4 shrink-0">
        <Button variant="outline" @click="showMapEditor = false">
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { toast } from 'vue-sonner'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  DrawerDescription 
} from '~/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '~/components/ui/dialog'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Button } from '~/components/ui/button'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import type { ExpenseCategory, PaymentMethod, TripExpense } from '~/types'
import CategorySelector from '~/components/common/CategorySelector.vue'
import { CATEGORY_TO_DIRECTUS, PAYMENT_TO_DIRECTUS, getCategoryFromDirectus, getPaymentMethodFromDirectus } from '~/utils/directus-mappings'
import { CURRENCIES } from '~/composables/useSettings'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { useGeolocation } from '~/composables/useGeolocation'

const props = defineProps<{
  open: boolean
  tripId: string
  expenseToEdit?: TripExpense | null
  tripMoneda?: string | null
}>()

const emit = defineEmits(['update:open', 'success'])

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const currencySymbol = computed(() => {
  if (!props.tripMoneda) return '$'
  const currencyInfo = CURRENCIES.find(c => c.code === props.tripMoneda)
  return currencyInfo?.symbol || '$'
})

const { createExpense, updateExpense } = useTripExpenses()
const { getCurrentLocation } = useGeolocation()

// Check if we're in edit mode
const isEditMode = computed(() => !!props.expenseToEdit)

// Form state
const form = reactive({
  amount: '',
  placeName: '',
  category: 'food' as ExpenseCategory,
  date: '', // ISO string
  location: {
    coordinates: {
      lat: 0,
      lng: 0
    },
    city: '',
    prefecture: ''
  },
  paymentMethod: 'cash' as PaymentMethod,
  shared: false,
  notes: ''
})

const isSubmitting = ref(false)
const locationCaptured = ref(false)
const showMapEditor = ref(false)

// Reset form when drawer opens/closes or edit mode changes
watch(() => props.open, async (newVal) => {
  if (newVal) {
    if (props.expenseToEdit) {
      // Load existing expense
      const expense = props.expenseToEdit
      form.amount = expense.monto.toString()
      form.placeName = expense.concepto
      form.category = getCategoryFromDirectus(expense.categoria)
      
      // Ensure date is in ISO format for the picker
      // expense.fecha is typically "YYYY-MM-DD HH:MM:SS"
      form.date = expense.fecha ? expense.fecha.replace(' ', 'T') : new Date().toISOString()
      
      form.location = {
        coordinates: {
          lat: expense.ubicacion_lat || 0,
          lng: expense.ubicacion_lng || 0
        },
        city: expense.ciudad || '',
        prefecture: expense.prefectura || ''
      }
      form.paymentMethod = getPaymentMethodFromDirectus(expense.metodo_pago)
      form.shared = expense.es_compartido
      form.notes = expense.notes || ''

      locationCaptured.value = !!(expense.ciudad && expense.prefectura)
    } else {
      // New expense
      resetForm()
      
      // Auto-capture location for new expenses
      const result = await getCurrentLocation()
      if (result) {
        form.location = { ...result }
        locationCaptured.value = true
      }
    }
  }
})

function resetForm() {
  form.amount = ''
  form.placeName = ''
  form.category = 'food'
  form.date = new Date().toISOString()
  form.location = {
    coordinates: { lat: 0, lng: 0 },
    city: '',
    prefecture: ''
  }
  form.paymentMethod = 'cash'
  form.shared = false
  form.notes = ''
  locationCaptured.value = false
}

// Handle location change from map editor
function handleLocationChange(data: { lat: number; lng: number; city: string; prefecture: string }) {
  form.location.coordinates.lat = data.lat
  form.location.coordinates.lng = data.lng
  form.location.city = data.city
  form.location.prefecture = data.prefecture
  locationCaptured.value = true
}

// Toggle shared
function toggleShared() {
  form.shared = !form.shared
}

// Form validation
const isFormValid = computed(() => {
  return (
    form.amount &&
    parseFloat(form.amount) > 0 &&
    form.placeName.trim() &&
    form.category &&
    form.date &&
    form.location.city.trim() &&
    form.location.prefecture.trim() &&
    form.paymentMethod
  )
})

// Helper to format date for API (YYYY-MM-DD HH:MM)
function formatTimestampForApi(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// Submit handler
async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const timestamp = formatTimestampForApi(form.date)

    const expenseData = {
      fecha: timestamp,
      concepto: form.placeName.trim(),
      monto: parseFloat(form.amount),
      categoria: CATEGORY_TO_DIRECTUS[form.category],
      notes: form.notes.trim(),
      ubicacion_lat: form.location.coordinates.lat,
      ubicacion_lng: form.location.coordinates.lng,
      ciudad: form.location.city,
      prefectura: form.location.prefecture,
      metodo_pago: PAYMENT_TO_DIRECTUS[form.paymentMethod],
      es_compartido: form.shared,
      viaje_id: props.tripId,
    }

    if (isEditMode.value && props.expenseToEdit) {
      await updateExpense(props.expenseToEdit.id as number | string, expenseData)
      toast.success('Gasto actualizado')
    } else {
      await createExpense({ ...expenseData, estado: 'real' } as any)
      toast.success('Gasto añadido')
    }

    emit('success')
    isOpen.value = false
  } catch (error) {
    console.error('Error saving expense:', error)
    toast.error('Error al guardar el gasto')
  } finally {
    isSubmitting.value = false
  }
}

// Save as planned expense handler
async function handleSavePlanned() {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const timestamp = formatTimestampForApi(form.date)

    const expenseData = {
      fecha: timestamp,
      concepto: form.placeName.trim(),
      monto: parseFloat(form.amount),
      categoria: CATEGORY_TO_DIRECTUS[form.category],
      notes: form.notes.trim(),
      ubicacion_lat: form.location.coordinates.lat,
      ubicacion_lng: form.location.coordinates.lng,
      ciudad: form.location.city,
      prefectura: form.location.prefecture,
      metodo_pago: PAYMENT_TO_DIRECTUS[form.paymentMethod],
      es_compartido: form.shared,
      viaje_id: props.tripId,
      estado: 'previsto' as const
    }

    await createExpense(expenseData)
    toast.success('Gasto previsto añadido')

    emit('success')
    isOpen.value = false
  } catch (error) {
    console.error('Error saving planned expense:', error)
    toast.error('Error al guardar el gasto previsto')
  } finally {
    isSubmitting.value = false
  }
}
</script>