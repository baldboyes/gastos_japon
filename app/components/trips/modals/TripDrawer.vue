<script setup lang="ts">
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { getLocalTimeZone, today, parseDate, type CalendarDate } from '@internationalized/date'
import { useMediaQuery } from '@vueuse/core'
import { DateFormatter } from '@internationalized/date'
import { 
  Loader2, 
  Trash2,
  Upload,
  Calendar as CalendarIcon,
  Check, 
  ChevronsUpDown, 
  Search,
  Plus
} from 'lucide-vue-next'

import { useDirectus } from '~/composables/useDirectus'
import { readUser } from '@directus/sdk'
import { fileUrl } from '~/utils/directusFiles'
import { useDirectusFiles } from '~/composables/useDirectusFiles'
import { SecureImage } from '~/components/ui/SecureImage'
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
import { toast } from 'vue-sonner'
// @ts-ignore
import { Country, City } from 'country-state-city'

const props = defineProps<{
  open: boolean
  tripToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])

const { createTrip, updateTrip, loading } = useTrips()

const selectedCountryCode = ref('')
const openCountry = ref(false)
const countrySearchQuery = ref('')

const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });

const countries = computed(() => {
  return Country.getAllCountries().map(country => {
    try {
      return {
        ...country,
        name: regionNames.of(country.isoCode) || country.name
      }
    } catch (e) {
      return country
    }
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'))
})

const filteredCountries = computed(() => {
  if (!countrySearchQuery.value) return countries.value
  const query = countrySearchQuery.value.toLowerCase()
  return countries.value.filter(c => c.name.toLowerCase().includes(query))
})

const cities = computed(() => {
  if (!selectedCountryCode.value) return []
  return City.getCitiesOfCountry(selectedCountryCode.value) || []
})

const getFilteredCities = (query: string) => {
  if (!query) return cities.value.slice(0, 50)
  const q = query.toLowerCase()
  return cities.value.filter(c => c.name.toLowerCase().includes(q)).slice(0, 50)
}

const onCountrySelect = (country: any) => {
  selectedCountryCode.value = country.isoCode
  console.log('Country:', country)
  openCountry.value = false
  countrySearchQuery.value = ''
  
  // Update formData with country data
  formData.value.isocode = country.isoCode
  formData.value.pais = country
  
  // Clear destinations when country changes
  formData.value.destinos = []
  
  // Auto-select currency if available and not in edit mode (or if user hasn't manually changed it yet)
  if (country.currency) {
    formData.value.moneda = country.currency
  }
}

const onCitySelect = (city: any, index: number) => {
  if (formData.value.destinos[index]) {
    formData.value.destinos[index].ciudad = city.name
    formData.value.destinos[index].ciudad_data = city
    formData.value.destinos[index]._isOpen = false
    formData.value.destinos[index]._citySearch = ''
  }
}

const selectedCountryName = computed(() => {
  const c = countries.value.find((c: any) => c.isoCode === selectedCountryCode.value)
  return c ? c.name : ''
})

const selectedCountryFlag = computed(() => {
  const c = countries.value.find((c: any) => c.isoCode === selectedCountryCode.value)
  return c ? c.flag : ''
})

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
  isocode: string
  pais: any
  destinos: Array<{
    ciudad: string
    fecha_inicio: any
    fecha_fin: any
    ciudad_data?: any
    _isOpen?: boolean
    _citySearch?: string
  }>
}>({
  nombre: '',
  portada: null,
  presupuesto_diario: undefined,
  moneda: '',
  isocode: '',
  pais: null,
  destinos: []
})

const addDestino = () => {
  formData.value.destinos.push({
    ciudad: '',
    fecha_inicio: null,
    fecha_fin: null,
    _isOpen: false,
    _citySearch: ''
  })
}

const removeDestino = (index: number) => {
  formData.value.destinos.splice(index, 1)
}

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
    formData.value.isocode = trip.isocode
    // Handle repeater field (array)
    formData.value.pais = Array.isArray(trip.pais) && trip.pais.length > 0 ? trip.pais[0] : trip.pais
    
    // Handle destinations
    if (trip.destinos && Array.isArray(trip.destinos)) {
      formData.value.destinos = trip.destinos.map((d: any) => ({
        ciudad: d.ciudad,
        fecha_inicio: d.fecha_inicio ? parseDate(d.fecha_inicio) : null,
        fecha_fin: d.fecha_fin ? parseDate(d.fecha_fin) : null,
        ciudad_data: d.ciudad_data,
        _isOpen: false,
        _citySearch: ''
      }))
    } else {
      formData.value.destinos = []
    }
    
    // Set selected country for UI
    if (trip.isocode) {
      selectedCountryCode.value = trip.isocode
    } else {
      selectedCountryCode.value = ''
    }
    
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
    formData.value.isocode = ''
    formData.value.pais = null
    formData.value.destinos = []
    selectedCountryCode.value = ''
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
    fecha_fin: endDate.value?.toString() || startDate.value.toString(),
    isocode: formData.value.isocode,
    // Send as array for repeater field
    pais: formData.value.pais ? [formData.value.pais] : null,
    // Send destinations with dates as strings
    destinos: formData.value.destinos.map(d => ({
      ciudad: d.ciudad,
      fecha_inicio: d.fecha_inicio ? d.fecha_inicio.toString() : null,
      fecha_fin: d.fecha_fin ? d.fecha_fin.toString() : null,
      ciudad_data: d.ciudad_data
    }))
  }

  try {
    if (isEditing.value && props.tripToEdit?.id) {
      await updateTrip(props.tripToEdit.id, tripData)
      toast.success('Viaje actualizado correctamente')
    } else {
      await createTrip(tripData)
      toast.success('Viaje creado correctamente')
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
        <div class="max-w-7xl w-full mx-auto flex gap-16 flex-col lg:flex-row pr-4">
          <div class="grid gap-4 py-4 w-full mx-auto">
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <Label htmlFor="name">Nombre del Viaje</Label>
                <Input id="name" v-model="formData.nombre" placeholder="Ej: Japón 2026" />
              </div>
              <div class="col-span-1">
                <Label>Destino</Label>
                <Popover v-model:open="openCountry">
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      role="combobox"
                      :aria-expanded="openCountry"
                      class="w-full justify-between font-normal border border-input"
                    >
                      <span class="truncate flex items-center gap-2">
                        <span v-if="selectedCountryFlag" class="mt-1">{{ selectedCountryFlag }}</span>
                        {{ selectedCountryName || "Selecciona un país" }}
                      </span>
                      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-[300px] p-0" align="start">
                    <div class="p-2 border-b border-gray-200">
                      <div class="flex items-center px-2 border border-input rounded-md">
                        <Search class="h-4 w-4 text-muted-foreground mr-2" />
                        <input 
                          v-model="countrySearchQuery"
                          class="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Buscar país..."
                        />
                      </div>
                    </div>
                    <div class="max-h-[300px] overflow-y-auto p-2">
                      <div
                        v-for="country in filteredCountries"
                        :key="country.isoCode"
                        @click="onCountrySelect(country)"
                        :class="cn(
                          'relative flex select-none items- gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          selectedCountryCode === country.isoCode ? 'bg-accent' : ''
                        )"
                      >
                        <Check
                          :class="cn(
                            'h-4 w-4',
                            selectedCountryCode === country.isoCode ? 'opacity-100' : 'opacity-0'
                          )"
                        />
                        <span class="mt-0.5">{{ country.flag }}</span>
                        {{ country.name }}
                      </div>
                      <div v-if="filteredCountries.length === 0" class="p-4 text-center text-sm text-muted-foreground">
                        No encontrado.
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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

            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <Label class="font-bold">Itinerario / Ciudades</Label>
                <Button size="sm" @click="addDestino" :disabled="!selectedCountryCode"><Plus class="h-3 w-3 mr-1" /> Añadir ciudad</Button>
              </div>
              <div v-if="!formData.destinos || formData.destinos.length === 0" class="text-sm text-center py-6 border-2 border-dashed rounded-lg bg-slate-50 text-muted-foreground">
                <p v-if="!selectedCountryCode">Selecciona un país primero.</p>
                <p v-else>Añade ciudades y fechas a tu itinerario.</p>
              </div>
              <div v-for="(destino, index) in formData.destinos" :key="index" class="p-4 rounded-lg relative bg-gray-50 shadow-sm border space-y-3">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-sm text-slate-600 flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs">{{ index + 1 }}</div>
                  </span>
                  <Button @click="removeDestino(index)" variant="ghost" size="icon" class="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- City Selector -->
                  <div class="col-span-1 md:col-span-2">
                    <Label class="text-xs mb-1.5 block">Ciudad</Label>
                    <Popover v-model:open="destino._isOpen">
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          role="combobox"
                          :aria-expanded="destino._isOpen"
                          class="w-full justify-between font-normal h-9"
                        >
                          <span class="truncate">{{ destino.ciudad || "Selecciona una ciudad" }}</span>
                          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-[300px] p-0" align="start">
                        <div class="p-2 border-b border-gray-200">
                          <div class="flex items-center px-2 border border-input rounded-md">
                            <Search class="h-4 w-4 text-muted-foreground mr-2" />
                            <input 
                              v-model="destino._citySearch"
                              class="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Buscar ciudad..."
                            />
                          </div>
                        </div>
                        <div class="max-h-[200px] overflow-y-auto p-2">
                          <div
                            v-for="city in getFilteredCities(destino._citySearch || '')"
                            :key="city.name"
                            @click="onCitySelect(city, index)"
                            :class="cn(
                              'relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer',
                              destino.ciudad === city.name ? 'bg-accent' : ''
                            )"
                          >
                            <Check
                              :class="cn(
                                'mr-2 h-4 w-4',
                                destino.ciudad === city.name ? 'opacity-100' : 'opacity-0'
                              )"
                            />
                            {{ city.name }}
                          </div>
                          <div v-if="getFilteredCities(destino._citySearch || '').length === 0" class="p-4 text-center text-sm text-muted-foreground">
                            No encontrado.
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <!-- Dates -->
                  <div>
                    <Label class="text-xs mb-1.5 block">Llegada</Label>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="cn(
                            'w-full justify-start text-left font-normal h-9',
                            !destino.fecha_inicio && 'text-muted-foreground'
                          )"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{ destino.fecha_inicio ? df.format(destino.fecha_inicio.toDate(getLocalTimeZone())) : "Fecha" }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0">
                        <Calendar 
                          v-model="destino.fecha_inicio" 
                          initial-focus 
                          :min-value="startDate"
                          :max-value="endDate"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label class="text-xs mb-1.5 block">Salida</Label>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="cn(
                            'w-full justify-start text-left font-normal h-9',
                            !destino.fecha_fin && 'text-muted-foreground'
                          )"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{ destino.fecha_fin ? df.format(destino.fecha_fin.toDate(getLocalTimeZone())) : "Fecha" }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0">
                        <Calendar 
                          v-model="destino.fecha_fin" 
                          initial-focus 
                          :min-value="destino.fecha_inicio || startDate"
                          :max-value="endDate"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
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