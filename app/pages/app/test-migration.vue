<script setup lang="ts">
import { useTripsNew } from '~/composables/useTripsNew'
import type { Trip } from '~/types/directus'

definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const { fetchTrips, trips, createTrip, loading, error } = useTripsNew()

const newTripForm = ref({
  title: 'Viaje de Prueba Migration',
  start_date: '2026-04-01',
  end_date: '2026-04-15',
  daily_budget: 10000,
  currency: 'JPY'
})

const handleCreate = async () => {
  try {
    await createTrip(newTripForm.value)
    alert('Viaje creado!')
    await fetchTrips()
  } catch (e) {
    alert('Error al crear: ' + e)
  }
}

onMounted(() => {
  fetchTrips()
})
</script>

<template>
  <div class="p-8 space-y-8">
    <h1 class="text-2xl font-bold">Test Migration & Permissions</h1>

    <!-- Create Form -->
    <div class="border p-4 rounded bg-gray-50 dark:bg-gray-800">
      <h2 class="font-semibold mb-4">Crear Viaje (Nueva Colección 'trips')</h2>
      <div class="grid gap-4 max-w-md">
        <input v-model="newTripForm.title" placeholder="Título" class="border p-2 rounded" />
        <input v-model="newTripForm.start_date" type="date" class="border p-2 rounded" />
        <input v-model="newTripForm.end_date" type="date" class="border p-2 rounded" />
        <input v-model="newTripForm.daily_budget" type="number" placeholder="Budget" class="border p-2 rounded" />
        <button 
          @click="handleCreate" 
          :disabled="loading"
          class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Creando...' : 'Crear Viaje' }}
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="bg-red-100 text-red-700 p-4 rounded">
      Error: {{ error }}
    </div>

    <!-- List -->
    <div>
      <h2 class="font-semibold mb-4">Lista de Viajes ({{ trips.length }})</h2>
      <div v-if="loading && trips.length === 0">Cargando...</div>
      <div v-else-if="trips.length === 0" class="text-gray-500">No hay viajes en la nueva colección.</div>
      
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="trip in trips" 
          :key="trip.id" 
          class="border p-4 rounded shadow-sm bg-white dark:bg-gray-900"
        >
          <h3 class="font-bold text-lg">{{ trip.title }}</h3>
          <div class="text-sm text-gray-500">
            {{ trip.start_date }} - {{ trip.end_date }}
          </div>
          <div class="mt-2 text-sm">
            <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
              {{ trip.status }}
            </span>
            <span class="ml-2 text-gray-600">
              User: {{ trip.user_created }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
