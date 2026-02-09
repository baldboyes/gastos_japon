<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Check, ChevronsUpDown, Search, MapPin, Loader2 } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { useLocations, type Prefecture, type City } from '~/composables/useLocations'
import EditableMap from '~/components/maps/Editable.vue'

interface LocationData {
  prefecture: string
  city: string
  latitude: number | undefined
  longitude: number | undefined
  address?: string
}

const props = defineProps<{
  modelValue: LocationData
}>()

const emit = defineEmits(['update:modelValue'])

const { prefectures, cities, fetchLocations, getCitiesByPrefecture, loading } = useLocations()

const openPrefecture = ref(false)
const openCity = ref(false)
const prefectureQuery = ref('')
const cityQuery = ref('')
const mapSearchQuery = ref('')
const isSearchingMap = ref(false)

// Initialize data
onMounted(() => {
  fetchLocations()
})

// Filtered Prefectures
const filteredPrefectures = computed(() => {
  if (!prefectureQuery.value) return prefectures.value
  const q = prefectureQuery.value.toLowerCase()
  return prefectures.value.filter(p => 
    p.name_en.toLowerCase().includes(q) || 
    p.name_ja.includes(q)
  )
})

// Filtered Cities (dependent on selected prefecture)
const availableCities = computed(() => {
  const currentPref = prefectures.value.find(p => p.name_en === props.modelValue.prefecture || p.name_ja === props.modelValue.prefecture)
  if (!currentPref) return []
  return getCitiesByPrefecture(currentPref.prefecture_id)
})

const filteredCities = computed(() => {
  if (!cityQuery.value) return availableCities.value
  const q = cityQuery.value.toLowerCase()
  return availableCities.value.filter(c => 
    c.name_en.toLowerCase().includes(q) || 
    c.name_ja.includes(q)
  )
})

// Selection Handlers
const selectPrefecture = (pref: Prefecture) => {
  emit('update:modelValue', {
    ...props.modelValue,
    prefecture: pref.name_en,
    city: ''
  })
  openPrefecture.value = false
  prefectureQuery.value = ''
}

const selectCity = (city: City) => {
  emit('update:modelValue', {
    ...props.modelValue,
    city: city.name_en
  })
  openCity.value = false
  cityQuery.value = ''
  
  geocodeCity(city.name_en, props.modelValue.prefecture)
}

const updateLocation = (loc: { lat: number; lng: number; city: string; prefecture: string }) => {
  emit('update:modelValue', {
    ...props.modelValue,
    latitude: loc.lat,
    longitude: loc.lng
  })
}

// Mapbox Geocoding
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFsZGJveSIsImEiOiJhMzBzeklzIn0.buJ1PP9-a9JkqNWGHW-H0g'

const geocodeCity = async (city: string, prefecture: string) => {
  try {
    const query = `${city}, ${prefecture}, Japan`
    await performSearch(query, false) // Don't auto-fill from reverse search when we are just centering
  } catch (e) {
    console.error('Error geocoding city:', e)
  }
}

const handleManualSearch = async () => {
  if (!mapSearchQuery.value) return
  await performSearch(mapSearchQuery.value, true)
}

const performSearch = async (query: string, autoFill: boolean) => {
  isSearchingMap.value = true
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=en`
    )
    const data = await response.json()
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lng, lat] = feature.center
      
      const updateData: any = {
        ...props.modelValue,
        latitude: lat,
        longitude: lng
      }

      // If manual search, try to extract City and Prefecture
      if (autoFill && feature.context) {
        // Update address with query or place_name
        updateData.address = query

        // Mapbox context example:
        // [{"id":"place.123","text":"Shinjuku"},{"id":"region.456","text":"Tokyo"},...]
        
        const region = feature.context.find((c: any) => c.id.startsWith('region'))
        const place = feature.context.find((c: any) => c.id.startsWith('place') || c.id.startsWith('locality'))

        if (region) {
          // Try to match with our CSV prefectures to be consistent
          const prefText = region.text
          // Normalize: remove 'Prefecture' suffix for comparison
          const cleanPrefText = prefText.replace(/ Prefecture$/i, '').toLowerCase()
          
          const match = prefectures.value.find(p => {
            const cleanP = p.name_en.replace(/ Prefecture$/i, '').toLowerCase()
            return cleanP === cleanPrefText || p.name_ja === prefText
          })
          
          if (match) {
            updateData.prefecture = match.name_en
            
            // If prefecture matched, try to match city
            if (place) {
              const placeText = place.text
              const cleanPlaceText = placeText.toLowerCase().replace(/ city$/i, '').replace(/-?ku$/i, '').replace(/-?shi$/i, '')
              
              // Get cities for this prefecture
              const prefCities = getCitiesByPrefecture(match.prefecture_id)
              
              const cityMatch = prefCities.find(c => {
                 // Check EN name
                 const cEn = c.name_en.toLowerCase()
                 // Handle "Ward, City" format in CSV vs "Ward" in Mapbox
                 // e.g. CSV: "Chūō-ku, Sapporo", Mapbox: "Chuo-ku"
                 
                 // Simple containment check or exact match of the first part
                 if (cEn === placeText.toLowerCase()) return true
                 if (c.name_ja === placeText) return true
                 
                 // Check if CSV city contains Mapbox place (e.g. "Chuo-ku, Sapporo" contains "Chuo-ku")
                 // Normalize accents for better matching?
                 
                 const firstPart = cEn.split(',')[0].trim()
                 const cleanFirst = firstPart.replace(/-?ku$/i, '').replace(/-?shi$/i, '')
                 
                 return cleanFirst === cleanPlaceText
              })
              
              if (cityMatch) {
                 updateData.city = cityMatch.name_en
              }
            }
          }
        }
      }

      emit('update:modelValue', updateData)
    }
  } catch (e) {
    console.error('Error searching map:', e)
  } finally {
    isSearchingMap.value = false
  }
}
</script>

<template>
  <div class="space-y-4">


    <!-- Map Search -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          v-model="mapSearchQuery" 
          placeholder="Buscar por dirección..." 
          class="pl-9"
          @keydown.enter.prevent="handleManualSearch"
        />
      </div>
      <Button variant="secondary" @click="handleManualSearch" :disabled="isSearchingMap">
        <Loader2 v-if="isSearchingMap" class="h-4 w-4 animate-spin mr-2" />
        <span v-else>Buscar</span>
      </Button>
    </div>

    <!-- Map -->
    <div class="space-y-2">
      <Label class="flex items-center gap-2">
        <MapPin class="h-4 w-4" /> Ubicación exacta
        <span class="text-xs font-normal text-muted-foreground">(Click en el mapa para ajustar)</span>
      </Label>
      <div class="h-[300px] w-full rounded-md border overflow-hidden relative">
        <EditableMap 
          :latitude="modelValue.latitude || 0" 
          :longitude="modelValue.longitude || 0"
          @location-change="updateLocation"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Prefecture Select -->
      <div class="space-y-2">
        <Label>Prefectura</Label>
        <Popover v-model:open="openPrefecture">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="openPrefecture"
              class="w-full justify-between"
            >
              <span class="truncate">{{ modelValue.prefecture || "Seleccionar prefectura..." }}</span>
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[250px] p-0" align="start">
            <div class="p-2 border-b">
              <div class="flex items-center px-2 border rounded-md">
                <Search class="h-4 w-4 text-muted-foreground mr-2" />
                <input 
                  v-model="prefectureQuery"
                  class="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Buscar..."
                />
              </div>
            </div>
            <div class="max-h-[300px] overflow-y-auto p-1">
              <div
                v-for="pref in filteredPrefectures"
                :key="pref.id"
                @click="selectPrefecture(pref)"
                :class="cn(
                  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer',
                  modelValue.prefecture === pref.name_en ? 'bg-accent' : ''
                )"
              >
                <Check
                  :class="cn(
                    'mr-2 h-4 w-4',
                    modelValue.prefecture === pref.name_en ? 'opacity-100' : 'opacity-0'
                  )"
                />
                <div class="flex flex-col">
                   <span>{{ pref.name_en }}</span>
                   <span class="text-xs text-muted-foreground">{{ pref.name_ja }}</span>
                </div>
              </div>
              <div v-if="filteredPrefectures.length === 0" class="p-2 text-sm text-center text-muted-foreground">
                No encontrado
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <!-- City Select -->
      <div class="space-y-2">
        <Label>Ciudad / Distrito</Label>
        <Popover v-model:open="openCity">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="openCity"
              class="w-full justify-between"
              :disabled="!modelValue.prefecture"
            >
              <span class="truncate">{{ modelValue.city || "Seleccionar ciudad..." }}</span>
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[250px] p-0" align="start">
            <div class="p-2 border-b">
              <div class="flex items-center px-2 border rounded-md">
                <Search class="h-4 w-4 text-muted-foreground mr-2" />
                <input 
                  v-model="cityQuery"
                  class="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Buscar..."
                />
              </div>
            </div>
            <div class="max-h-[300px] overflow-y-auto p-1">
              <div
                v-for="city in filteredCities"
                :key="city.id"
                @click="selectCity(city)"
                :class="cn(
                  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer',
                  modelValue.city === city.name_en ? 'bg-accent' : ''
                )"
              >
                <Check
                  :class="cn(
                    'mr-2 h-4 w-4',
                    modelValue.city === city.name_en ? 'opacity-100' : 'opacity-0'
                  )"
                />
                <div class="flex flex-col">
                   <span>{{ city.name_en }}</span>
                   <span class="text-xs text-muted-foreground">{{ city.name_ja }} {{ city.special_district_ja ? `(${city.special_district_ja})` : '' }}</span>
                </div>
              </div>
              <div v-if="filteredCities.length === 0" class="p-2 text-sm text-center text-muted-foreground">
                No encontrado
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>

  </div>
</template>
