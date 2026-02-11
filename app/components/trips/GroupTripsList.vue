<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { MapPin, Loader2, Calendar as CalendarIcon } from 'lucide-vue-next'
  import { Button } from '~/components/ui/button'


  // Estado interno del componente
  const trips = ref<Array<{
    slug: string
    title: string
    inicio: string
    fin: string
    desde: string
    description: string
    thumb: string
  }>>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Props opcionales para personalización
  interface Props {
    apiUrl?: string
    title?: string
    description?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    apiUrl: 'https://porjapon.com/api/viajes-en-grupo.json',
    title: '¿No te quieres complicar?',
    description: 'Descubre nuestros viajes organizados a Japón y vente con nosotros.'
  })

  // Función para obtener viajes en grupo
  const fetchGroupTrips = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(props.apiUrl)
      if (!response.ok) {
        throw new Error('Error al cargar viajes en grupo')
      }
      const data = await response.json()
      trips.value = data
    } catch (err) {
      console.error('Error fetching group trips:', err)
      error.value = 'No se pudieron cargar los viajes en grupo'
    } finally {
      loading.value = false
    }
  }

  // Cargar viajes al montar el componente
  onMounted(() => {
    fetchGroupTrips()
  })
</script>

<template>
  <div class="w-full py-16">
    <div class="max-w-4xl mx-auto space-y-6 px-4 lg:px-0">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">{{ title }}</h2>
          <p class="text-muted-foreground">{{ description }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-destructive">{{ error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="trips.length === 0" class="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
        <MapPin class="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 class="mt-4 text-lg font-semibold">No hay viajes en grupo disponibles</h3>
        <p class="text-muted-foreground">Pronto anunciaremos nuevos viajes organizados.</p>
      </div>

      <!-- Lista de Viajes en Grupo -->
      <div v-else class="flex flex-col gap-6">
        <div 
          v-for="trip in trips" 
          :key="trip.slug" 
          class="flex flex-col md:flex-row bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-input overflow-hidden group"
        >
          <!-- Imagen -->
          <div class="w-full md:w-48 h-48 relative shrink-0">
            <img 
              :src="`https://porjapon.com${trip.thumb}`" 
              :alt="trip.title"
              class="w-full h-full object-cover"
            >
          </div>
          
          <!-- Contenido -->
          <div class="flex flex-1 flex-col md:flex-row p-6 gap-6 items-start md:items-center">
            <!-- Info -->
            <div class="flex-1 space-y-3">
              <div>
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {{ trip.title }}
                </h3>
                <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1.5">
                    <CalendarIcon class="h-4 w-4" />
                    <span>{{ trip.inicio }} - {{ trip.fin }}</span>
                  </div>
                  <div v-if="trip.desde !== '---'" class="font-semibold text-primary">
                    Desde {{ trip.desde }}€
                  </div>
                </div>
              </div>
              
              <p class="text-muted-foreground line-clamp-2 md:line-clamp-2">
                {{ trip.description }}
              </p>
            </div>

            <!-- Botón -->
            <div class="w-full md:w-auto shrink-0">
              <Button class="w-full md:w-auto" as-child>
                <a :href="`https://porjapon.com/viajes-en-grupo-a-japon/${trip.slug}`" target="_blank">
                  Ver viaje
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>