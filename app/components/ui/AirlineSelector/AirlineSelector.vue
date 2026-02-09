<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Check, ChevronsUpDown, Plane, Search } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { useAirlines } from '~/composables/useAirlines'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const searchQuery = ref('')
const { airlines, fetchAirlines, loading } = useAirlines()

onMounted(() => {
  fetchAirlines()
})

const POPULAR_AIRLINES = [
  'Iberia Airlines', 'Japan Airlines', 'All Nippon Airways', 
  'British Airways', 'Air France', 'Lufthansa', 'Qatar Airways', 
  'Emirates', 'Finnair', 'KLM Royal Dutch Airlines', 'Etihad Airways',
  'Peach Aviation', 'Jetstar Japan', 'Vueling Airlines'
]

const filteredAirlines = computed(() => {
  if (!searchQuery.value) {
    // Si no hay búsqueda, mostrar solo las populares que existan en el dataset
    // Ordenamos para que salgan en el orden de nuestra lista de preferencia
    const populars = airlines.value.filter(a => POPULAR_AIRLINES.includes(a.name))
    return populars.sort((a, b) => {
       return POPULAR_AIRLINES.indexOf(a.name) - POPULAR_AIRLINES.indexOf(b.name)
    })
  }
  
  const query = searchQuery.value.toLowerCase()
  return airlines.value
    .filter(a => a.name.toLowerCase().includes(query))
    .slice(0, 50)
})

const selectedAirline = computed(() => 
  airlines.value.find(a => a.name === props.modelValue)
)

const selectAirline = (name: string) => {
  emit('update:modelValue', name)
  open.value = false
  searchQuery.value = ''
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full justify-between border-input hover:bg-white focus-visible:border-ring focus-visible:ring-ring/50"
      >
        <div class="flex items-center gap-2 truncate w-full">
          <img 
            v-if="selectedAirline?.logo" 
            :src="selectedAirline.logo" 
            class="h-5 w-5 object-contain" 
            alt=""
            @error="handleImageError"
          />
          <Plane v-else class="h-4 w-4 opacity-50" />
          <span class="truncate">{{ modelValue || "Seleccionar aerolínea..." }}</span>
        </div>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[300px] p-0" align="start">
      <div class="p-2 border-b border-gray-200">
        <div class="flex items-center px-2 border border-input rounded-md">
          <Search class="h-4 w-4 text-muted-foreground mr-2" />
          <input 
            v-model="searchQuery"
            class="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-input hover:bg-white focus-visible:border-ring focus-visible:ring-ring/50"
            placeholder="Buscar aerolínea..."
          />
        </div>
      </div>
      
      <div class="max-h-[300px] overflow-y-auto p-2">
        <div v-if="loading" class="p-4 text-center text-sm text-muted-foreground">
          Cargando...
        </div>
        <div v-else-if="filteredAirlines.length === 0" class="p-4 text-center text-sm text-muted-foreground">
          No encontrada.
        </div>
        <div
          v-for="airline in filteredAirlines"
          :key="airline.id"
          @click="selectAirline(airline.name)"
          :class="cn(
            'relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer',
            modelValue === airline.name ? 'bg-accent' : ''
          )"
        >
          <Check
            :class="cn(
              'mr-2 h-4 w-4 hidden',
              modelValue === airline.name ? 'opacity-100' : 'opacity-0'
            )"
          />
          <div class="flex items-center gap-2">
             <img 
              :src="airline.logo" 
              class="h-6 w-6 object-contain bg-white rounded-sm" 
              loading="lazy"
              @error="handleImageError"
            />
            <span>{{ airline.name }}</span>
          </div>
        </div>

        <div v-if="!searchQuery && filteredAirlines.length > 0" class="px-2 py-2 text-xs text-center text-muted-foreground mt-2">
          Escribe para buscar más...
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
