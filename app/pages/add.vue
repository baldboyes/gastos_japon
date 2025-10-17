<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto p-4 mb-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ isEditMode ? 'Editar Gasto' : 'Nuevo Gasto' }}</h1>
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
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Amount -->
        <div>
          <Label for="amount" class="text-base">Gasto ({{ currencySymbol }}) *</Label>
          <div class="relative mt-2">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-600">{{ currencySymbol }}</span>
            <Input
              id="amount"
              v-model="form.amount"
              type="number"
              placeholder="1,200"
              class="pl-10 text-2xl h-14"
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
            class="mt-2"
            required
          />
        </div>

        <!-- Category -->
        <CategorySelector v-model="form.category" />

        <!-- Date and Time -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label for="date" class="text-base">Fecha *</Label>
            <Input
              id="date"
              v-model="form.date"
              type="date"
              class="mt-2"
              required
            />
          </div>
          <div>
            <Label for="time" class="text-base">Hora *</Label>
            <Input
              id="time"
              v-model="form.time"
              type="time"
              class="mt-2"
              required
            />
          </div>
        </div>

        <!-- Location -->
        <div>
          <Label class="text-base mb-2 block">Ubicación *</Label>
          <Card>
            <CardContent class="p-4 space-y-3">
              <button
                v-if="!locationCaptured"
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
                <span>{{ locationLoading ? 'Obteniendo ubicación...' : 'Capturar Ubicación Actual' }}</span>
              </button>

              <div v-if="locationError" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {{ locationError }}
              </div>

              <div v-if="locationCaptured" class="space-y-3">
                <div class="flex items-start gap-2 text-sm text-gray-700 bg-teal-50 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 text-teal-600">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <div>
                    <div class="font-medium">{{ form.location.city }}</div>
                    <div class="text-xs text-gray-600">{{ form.location.prefecture }}</div>
                  </div>
                </div>

                <button
                  type="button"
                  class="text-sm text-gray-600 hover:text-gray-900"
                  @click="resetLocation"
                >
                  Cambiar ubicación
                </button>
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
                      placeholder="Tokyo"
                      class="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label for="prefecture" class="text-sm">Prefectura</Label>
                    <Input
                      id="prefecture"
                      v-model="form.location.prefecture"
                      type="text"
                      placeholder="Tokyo"
                      class="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Payment Method -->
        <div>
          <Label class="text-base mb-3 block">Método de Pago *</Label>
          <div class="grid grid-cols-3 gap-3">
            <button
              type="button"
              class="flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all"
              :class="[
                form.paymentMethod === 'cash'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              ]"
              @click="form.paymentMethod = 'cash'"
            >
              <span class="text-2xl">💴</span>
              <span class="font-medium">Efectivo</span>
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all"
              :class="[
                form.paymentMethod === 'card'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              ]"
              @click="form.paymentMethod = 'card'"
            >
              <span class="text-2xl">💳</span>
              <span class="font-medium">Tarjeta</span>
            </button>
            <button
              type="button"
              class="flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all"
              :class="[
                form.paymentMethod === 'ic'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              ]"
              @click="form.paymentMethod = 'ic'"
            >
              <span class="text-2xl">🎫</span>
              <span class="font-medium">IC</span>
            </button>
          </div>
        </div>

        <!-- Shared -->
        <div class="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
          <Checkbox
            id="shared"
            v-model:checked="form.shared"
          />
          <Label for="shared" class="text-base cursor-pointer flex items-center gap-2">
            <span>👥</span>
            <span>Gasto compartido</span>
          </Label>
        </div>

        <!-- Notes -->
        <div>
          <Label for="notes" class="text-base">Notas</Label>
          <Textarea
            id="notes"
            v-model="form.notes"
            placeholder="Agrega detalles adicionales sobre este gasto..."
            class="mt-2 min-h-[100px]"
          />
        </div>

        <!-- Submit Button -->
        <div class="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            class="flex-1"
            @click="navigateTo('/')"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            class="flex-1 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
            :disabled="!isFormValid || isSubmitting"
          >
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Gasto' : 'Guardar gasto') }}
          </Button>
        </div>
      </form>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { ExpenseCategory, PaymentMethod } from '~/types'
import { getCurrentTimestamp } from '~/utils/dates'

const { currencySymbol } = useCurrency()
const route = useRoute()
const { addExpense, updateExpense, getExpense } = useExpenses()
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

// Initialize form
onMounted(() => {
  if (isEditMode.value && expenseId.value) {
    // Load existing expense
    const expense = getExpense(expenseId.value)
    if (expense) {
      const timestamp = new Date(expense.timestamp)
      form.amount = expense.amount.toString()
      form.placeName = expense.placeName
      form.category = expense.category
      form.date = timestamp.toISOString().split('T')[0]
      form.time = timestamp.toTimeString().slice(0, 5)
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
    // New expense - initialize with current date and time
    const now = new Date()
    form.date = now.toISOString().split('T')[0]
    form.time = now.toTimeString().slice(0, 5)
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
    // Combine date and time
    const timestamp = `${form.date}T${form.time}:00`

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
</script>
