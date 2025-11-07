<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto p-4 mb-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div v-if="isEditMode">
          <h1 class="text-2xl font-bold text-gray-900">Editar gasto</h1>
        </div>
        <div v-else class="flex items-center gap-2">
          <button
            type="button"
            @click="showDateTimeEdit = true"
            class=" hover:text-teal-600 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <div class="flex items-center gap-2">
              <span class="font-bold text-base text-gray-800">{{ formatDate(form.date).slice(0, -5) }}</span>
              <span class="text-base text-gray-800">{{ form.time }}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>

          <div v-if="form.location.city" class="text-base font-bold text-gray-900"> | {{ form.location.city }}</div>


        </div>

        
        <button
          class="text-gray-600 hover:text-gray-900 transition-colors"
          @click="navigateTo('/')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="flex items-start justify-between gap-4">
          
          <div class="w-3/4 space-y-4 ">
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
                    ? 'border-teal-500 bg-teal-50'
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
                    ? 'border-teal-500 bg-teal-50'
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
                    ? 'border-teal-500 bg-teal-50'
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
        <CategorySelector v-model="form.category" />

        <!-- Date and Time -->
        <div v-if="isEditMode || showDateTimeEdit" class="grid grid-cols-2 gap-4">
          <div class="w-full overflow-hidden">
            <Label for="date" class="text-base">Fecha *</Label>
            <Input
              id="date"
              v-model="form.date"
              type="date"
              class="mt-2 h-14 text-xl bg-white"
              required
            />
          </div>
          <div class="w-full overflow-hidden">
            <Label for="time" class="text-base">Hora *</Label>
            <Input
              id="time"
              v-model="form.time"
              type="time"
              class="mt-2 h-14 text-xl bg-white"
              required
            />
          </div>
        </div>

        <!-- Location -->
        <div>
          <Label class="text-base mb-2 block">Ubicación *</Label>
          <Card>
            <CardContent class="py-0 px-4 space-y-2">
              <!-- Add Mode: Capture Location Button -->
              <button
                v-if="!isEditMode && !locationCaptured"
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="captureLocation"
                :disabled="locationLoading"
              >
                <svg v-if="!locationLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <svg v-else class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>{{ locationLoading ? 'Obteniendo ubicación...' : 'Capturar ubicación actual' }}</span>
              </button>

              <div v-if="locationError" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {{ locationError }}
              </div>

              <!-- Show location info if captured OR in edit mode -->
              <div v-if="locationCaptured || isEditMode" class="space-y-3">
                <div class="flex items-start gap-2 text-sm text-gray-700 bg-teal-50 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 text-teal-600">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <div>
                    <div class="font-medium">{{ form.location.city || 'Sin ubicación' }}</div>
                    <div class="text-xs text-gray-600">{{ form.location.prefecture || 'Sin prefectura' }}</div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <!-- Add Mode: Reset button -->
                  <button
                    v-if="!isEditMode"
                    type="button"
                    class="text-sm text-gray-600 hover:text-gray-900"
                    @click="resetLocation"
                  >
                    Cambiar ubicación
                  </button>

                  <!-- Edit Mode: Map editor button (always visible) -->
                  <button
                    v-if="isEditMode"
                    type="button"
                    class="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    @click="showMapEditor = true"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Editar en el mapa
                  </button>
                </div>
              </div>

              <!-- Manual Location (fallback) -->
              <div v-if="showManualLocation" class="space-y-3 pt-3 border-t">
                <div class="text-sm text-gray-600 mb-2">O ingresar manualmente:</div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <Label for="city" class="text-sm">Ciudad</Label>
                    <Input
                      id="city"
                      v-model="form.location.city"
                      type="text"
                      placeholder="Kobe"
                      class="mt-1 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label for="prefecture" class="text-sm">Prefectura</Label>
                    <Input
                      id="prefecture"
                      v-model="form.location.prefecture"
                      type="text"
                      placeholder="Hyogo"
                      class="mt-1 bg-white"
                      required
                    />
                  </div>
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
            :class="form.shared ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'"
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


        <!-- Submit Buttons -->
        <div class="flex gap-3 pt-4">
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
            v-else
            type="button"
            variant="outline"
            class="w-1/3 h-14"
            @click="navigateTo('/')"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            class="flex-1 bg-teal-600 hover:from-teal-600 hover:to-teal-700 h-14"
            :disabled="!isFormValid || isSubmitting"
          >
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Añadir') }}
          </Button>
        </div>
      </form>

      <!-- Map Editor Dialog (Edit Mode Only) -->
      <Dialog v-model:open="showMapEditor">
        <DialogContent class="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader class="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Editar ubicación en el Mapa</DialogTitle>
            <DialogDescription>
              Toca en el mapa para cambiar la ubicación del gasto
            </DialogDescription>
          </DialogHeader>
          <div class="flex-1 px-6 min-h-0">
            <EditableMap
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
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { ExpenseCategory, PaymentMethod } from '~/types'
import { getCurrentTimestamp, formatDate, getCurrentDateString, getCurrentTimeString, getDateString, getTimeString } from '~/utils/dates'

const { currencySymbol } = useCurrency()
const route = useRoute()
const { addExpense, updateExpense, getExpense, addPlannedExpense } = useExpenses()
const { getCurrentLocation, location, loading: locationLoading, error: geoError } = useGeolocation()

// Check if we're in edit mode
const isEditMode = computed(() => !!route.query.id)
const expenseId = computed(() => route.query.id as string | undefined)

// Form state
const form = reactive({
  amount: '',
  placeName: '',
  category: 'food' as ExpenseCategory,
  date: '',
  time: '',
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
const locationError = ref('')
const showManualLocation = ref(false)
const showDateTimeEdit = ref(false)
const showMapEditor = ref(false)

// Initialize form
onMounted(async () => {
  if (isEditMode.value && expenseId.value) {
    // Load existing expense
    const expense = getExpense(expenseId.value)
    if (expense) {
      form.amount = expense.amount.toString()
      form.placeName = expense.placeName
      form.category = expense.category
      form.date = getDateString(expense.timestamp)
      form.time = getTimeString(expense.timestamp)
      form.location = { ...expense.location }
      form.paymentMethod = expense.paymentMethod
      form.shared = expense.shared
      form.notes = expense.notes || ''

      // Mark location as captured if it exists
      if (expense.location.city && expense.location.prefecture) {
        locationCaptured.value = true
      }
    }
  } else {
    // New expense - initialize with current date and time (local timezone)
    form.date = getCurrentDateString()
    form.time = getCurrentTimeString()

    // Auto-capture location for new expenses
    await captureLocation()
  }
})

// Capture location
async function captureLocation() {
  locationError.value = ''
  showManualLocation.value = false

  const result = await getCurrentLocation()

  if (result) {
    form.location = { ...result }
    locationCaptured.value = true
  } else if (geoError.value) {
    locationError.value = geoError.value
    showManualLocation.value = true
    // Set default values for manual entry
    form.location.coordinates.lat = 0
    form.location.coordinates.lng = 0
  }
}

function resetLocation() {
  locationCaptured.value = false
  showManualLocation.value = false
  form.location = {
    coordinates: {
      lat: 0,
      lng: 0
    },
    city: '',
    prefecture: ''
  }
}

// Handle location change from map editor
function handleLocationChange(data: { lat: number; lng: number; city: string; prefecture: string }) {
  form.location.coordinates.lat = data.lat
  form.location.coordinates.lng = data.lng
  form.location.city = data.city
  form.location.prefecture = data.prefecture
  locationCaptured.value = true
}

// Toggle shared/destacado
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
    form.time &&
    form.location.city.trim() &&
    form.location.prefecture.trim() &&
    form.paymentMethod
  )
})

// Submit handler
async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // Store date and time as a simple string without timezone conversion
    // Format: "YYYY-MM-DD HH:MM" (not ISO format to avoid timezone issues)
    const timestamp = `${form.date} ${form.time}`

    const expenseData = {
      timestamp,
      placeName: form.placeName.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      notes: form.notes.trim(),
      location: form.location,
      paymentMethod: form.paymentMethod,
      shared: form.shared
    }

    if (isEditMode.value && expenseId.value) {
      // Update existing expense
      const success = updateExpense(expenseId.value, expenseData)
      if (!success) {
        alert('Error al actualizar el gasto. Por favor intenta de nuevo.')
        return
      }
    } else {
      // Add new expense
      addExpense(expenseData)
    }

    // Success! Navigate back to home
    await navigateTo('/')
  } catch (error) {
    console.error('Error saving expense:', error)
    alert('Error al guardar el gasto. Por favor intenta de nuevo.')
  } finally {
    isSubmitting.value = false
  }
}

// Save as planned expense handler
async function handleSavePlanned() {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const plannedExpenseData = {
      plannedDate: form.date, // Use the date from the form
      placeName: form.placeName.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      notes: form.notes.trim(),
      location: form.location,
      paymentMethod: form.paymentMethod,
      shared: form.shared
    }

    addPlannedExpense(plannedExpenseData)

    // Success! Navigate back to home
    await navigateTo('/')
  } catch (error) {
    console.error('Error saving planned expense:', error)
    alert('Error al guardar el gasto previsto. Por favor intenta de nuevo.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
