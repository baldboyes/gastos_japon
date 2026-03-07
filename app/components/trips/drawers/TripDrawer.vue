<script setup lang="ts">
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { getLocalTimeZone, today, parseDate, type CalendarDate } from '@internationalized/date'
import { useMediaQuery } from '@vueuse/core'
import { DateFormatter } from '@internationalized/date'
import { useRoute } from 'vue-router'
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

import { useDirectusRepo } from '~/composables/useDirectusRepo'
import { readUser } from '@directus/sdk'
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
} from '~/components/ui/drawer'
import { ScrollArea } from '~/components/ui/scroll-area'
import { toast } from 'vue-sonner'
import { useTripsNew } from '~/composables/useTripsNew'
import type { Trip } from '~/types/directus'
// @ts-ignore
import { Country, City } from 'country-state-city'

const props = defineProps<{
  open: boolean
  tripToEdit?: Trip | null
}>()

const emit = defineEmits(['update:open', 'saved'])
const route = useRoute()
const i18n = useI18n()
const { t } = i18n

const currentLocale = computed(() => {
  const candidate = (route.path || '').split('/')[1] || ''
  const all = i18n?.$getLocales?.() || []
  const codes = all.map((l: any) => l.code)
  return codes.includes(candidate) ? candidate : 'en'
})

const localeTag = computed(() => {
  if (currentLocale.value === 'es') return 'es-ES'
  if (currentLocale.value === 'ja') return 'ja-JP'
  return 'en-US'
})

// New Composable
const { createTrip, updateTrip, loading } = useTripsNew()

const selectedCountryCode = ref('')
const openCountry = ref(false)
const countrySearchQuery = ref('')

const regionNames = computed(() => new Intl.DisplayNames([currentLocale.value], { type: 'region' }))

const countries = computed(() => {
  return Country.getAllCountries().map((country: any) => {
    try {
      return {
        ...country,
        name: regionNames.value.of(country.isoCode) || country.name
      }
    } catch (e) {
      return country
    }
  }).sort((a: any, b: any) => a.name.localeCompare(b.name, currentLocale.value))
})

const filteredCountries = computed(() => {
  if (!countrySearchQuery.value) return countries.value
  const query = countrySearchQuery.value.toLowerCase()
  return countries.value.filter((c: any) => c.name.toLowerCase().includes(query))
})

const cities = computed(() => {
  if (!selectedCountryCode.value) return []
  return City.getCitiesOfCountry(selectedCountryCode.value) || []
})

const getFilteredCities = (query: string) => {
  if (!query) return cities.value.slice(0, 50)
  const q = query.toLowerCase()
  return cities.value.filter((c: any) => c.name.toLowerCase().includes(q)).slice(0, 50)
}

const onCountrySelect = (country: any) => {
  selectedCountryCode.value = country.isoCode
  openCountry.value = false
  countrySearchQuery.value = ''
  
  // Update formData with country data
  formData.value.iso_code = country.isoCode
  formData.value.country = country
  
  // Clear destinations when country changes
  formData.value.destinations = []
  
  // Auto-select currency if available
  if (country.currency) {
    formData.value.currency = country.currency
  }
}

const onCitySelect = (city: any, index: number) => {
  if (formData.value.destinations[index]) {
    formData.value.destinations[index].city = city.name
    formData.value.destinations[index].city_data = city
    formData.value.destinations[index]._isOpen = false
    formData.value.destinations[index]._citySearch = ''
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
const { getClient, directusUserId } = useDirectusRepo()

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
    const client = await getClient()
    
    if (!directusUserId.value) {
      console.warn('No Directus User ID found')
      return
    }

    // Assuming user collection still has 'moneda' or similar field? 
    // We didn't migrate users collection, it's system.
    // Assuming 'moneda' field exists on directus_users as before.
    const userData = await client.request(readUser(directusUserId.value, {
      fields: ['moneda'] // Keeping 'moneda' if it's a custom field on user
    }))
    
    if (userData && (userData as any).moneda) {
      defaultCurrency.value = (userData as any).moneda
      if (!props.tripToEdit) {
        formData.value.currency = (userData as any).moneda
      }
    }
  } catch (e) {
    console.error('Error fetching user preference:', e)
  } finally {
    loadingPreference.value = false
  }
}

// Formulario (English keys)
const formData = ref<{
  title: string
  cover_image: string | null
  daily_budget: number | undefined
  currency: string
  iso_code: string
  country: any
  destinations: Array<{
    city: string
    start_date: any
    end_date: any
    city_data?: any
    _isOpen?: boolean
    _citySearch?: string
  }>
}>({
  title: '',
  cover_image: null,
  daily_budget: undefined,
  currency: '',
  iso_code: '',
  country: null,
  destinations: []
})

const addDestino = () => {
  formData.value.destinations.push({
    city: '',
    start_date: null,
    end_date: null,
    _isOpen: false,
    _citySearch: ''
  })
}

const removeDestino = (index: number) => {
  formData.value.destinations.splice(index, 1)
}

// Fechas
const startDate = ref<any>(today(getLocalTimeZone()))
const endDate = ref<any>(today(getLocalTimeZone()).add({ days: 7 }))

const df = computed(() => new DateFormatter(localeTag.value, { dateStyle: 'long' }))

const formatDateLong = (d: any) => {
  if (!d) return ''
  return df.value.format(d.toDate(getLocalTimeZone()))
}

// Sync start/end dates
watch(startDate, (newVal) => {
  if (endDate.value && newVal && newVal.compare(endDate.value) > 0) {
    endDate.value = newVal
  }
})

const isDesktop = useMediaQuery('(min-width: 768px)')

onMounted(() => {
  fetchUserPreference()
})

// Sync open state
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

watch(() => props.open, (isOpen) => {
  if (isOpen && !props.tripToEdit) {
    fetchUserPreference()
  }
})

// Watch changes in tripToEdit
watch(() => props.tripToEdit, (trip) => {
  if (trip) {
    formData.value.title = trip.title
    formData.value.cover_image = trip.cover_image || null
    formData.value.daily_budget = trip.daily_budget
    formData.value.currency = trip.currency || ''
    formData.value.iso_code = trip.iso_code || ''
    
    // Handle country array/json
    formData.value.country = Array.isArray(trip.country) && trip.country.length > 0 ? trip.country[0] : trip.country
    
    // Handle destinations
    if (trip.destinations && Array.isArray(trip.destinations)) {
      formData.value.destinations = trip.destinations.map((d: any) => ({
        city: d.city,
        start_date: d.start_date ? parseDate(d.start_date) : null,
        end_date: d.end_date ? parseDate(d.end_date) : null,
        city_data: d.city_data,
        _isOpen: false,
        _citySearch: ''
      }))
    } else {
      formData.value.destinations = []
    }
    
    if (trip.iso_code) {
      selectedCountryCode.value = trip.iso_code
    } else {
      selectedCountryCode.value = ''
    }
    
    try {
      if (trip.start_date) {
        startDate.value = parseDate(trip.start_date)
        endDate.value = trip.end_date ? parseDate(trip.end_date) : startDate.value
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
    // Reset form
    formData.value.title = ''
    formData.value.cover_image = null
    formData.value.daily_budget = undefined
    formData.value.currency = defaultCurrency.value
    formData.value.iso_code = ''
    formData.value.country = null
    formData.value.destinations = []
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

  if (file.size > 10 * 1024 * 1024) {
    toast.error(String(t('trip_drawer.cover.too_large')))
    return
  }

  uploadingCover.value = true
  try {
    const fileId = await uploadFile(file)
    formData.value.cover_image = fileId
  } catch (e) {
    console.error('Error uploading cover:', e)
  } finally {
    uploadingCover.value = false
    input.value = ''
  }
}

const handleSubmit = async () => {
  if (!formData.value.title || !startDate.value) return

  const tripData = {
    title: formData.value.title,
    cover_image: formData.value.cover_image,
    daily_budget: formData.value.daily_budget,
    currency: formData.value.currency,
    start_date: startDate.value.toString(),
    end_date: endDate.value?.toString() || startDate.value.toString(),
    iso_code: formData.value.iso_code,
    country: formData.value.country ? [formData.value.country] : null,
    destinations: formData.value.destinations.map(d => ({
      city: d.city,
      start_date: d.start_date ? d.start_date.toString() : null,
      end_date: d.end_date ? d.end_date.toString() : null,
      city_data: d.city_data
    }))
  }

  try {
    if (isEditing.value && props.tripToEdit?.id) {
      await updateTrip(props.tripToEdit.id, tripData)
      toast.success(String(t('trip_drawer.toasts.updated')))
    } else {
      await createTrip(tripData)
      toast.success(String(t('trip_drawer.toasts.created')))
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
        <DrawerTitle>{{ isEditing ? $t('trip_drawer.title.edit') : $t('trip_drawer.title.new') }}</DrawerTitle>
      </DrawerHeader>
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl w-full mx-auto flex gap-16 flex-col lg:flex-row pr-4">
          <div class="grid gap-4 py-4 w-full mx-auto">
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <Label htmlFor="name">{{ $t('trip_drawer.fields.name') }}</Label>
                <Input id="name" v-model="formData.title" :placeholder="String($t('trip_drawer.placeholders.name'))" />
              </div>
              <div class="col-span-1">
                <Label>{{ $t('trip_drawer.fields.destination_country') }}</Label>
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
                        {{ selectedCountryName || $t('trip_drawer.placeholders.select_country') }}
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
                          :placeholder="String($t('trip_drawer.placeholders.search_country'))"
                        />
                      </div>
                    </div>
                    <div class="max-h-[300px] overflow-y-auto p-2">
                      <div
                        v-for="country in filteredCountries"
                        :key="country.isoCode"
                        @click="onCountrySelect(country)"
                        :class="cn(
                          'relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer',
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
                        {{ $t('trip_drawer.common.not_found') }}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div class="grid gap-2">
              <Label>{{ $t('trip_drawer.fields.dates') }}</Label>
              <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex flex-col gap-2 w-full">
                  <Label class="text-xs text-muted-foreground">{{ $t('trip_drawer.fields.start') }}</Label>
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
                        {{ startDate ? formatDateLong(startDate) : $t('trip_drawer.placeholders.select_date') }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0">
                      <Calendar v-model="startDate" initial-focus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div class="flex flex-col gap-2 w-full">
                  <Label class="text-xs text-muted-foreground">{{ $t('trip_drawer.fields.end') }}</Label>
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
                        {{ endDate ? formatDateLong(endDate) : $t('trip_drawer.placeholders.select_date') }}
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
                <Label htmlFor="presupuesto">{{ $t('trip_drawer.fields.daily_budget') }}</Label>
                <Input id="presupuesto" v-model="formData.daily_budget" type="number" :placeholder="String($t('trip_drawer.placeholders.daily_budget'))" />
              </div>
              <div class="w-full">
                <div class="flex items-center gap-2 mb-2">
                  <Label htmlFor="moneda">{{ $t('trip_drawer.fields.currency') }}</Label>
                  <Loader2 v-if="loadingPreference" class="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
                <CurrencySelector v-model="formData.currency" />
              </div>
            </div>
            <div class="grid gap-2">
              <Label>{{ $t('trip_drawer.fields.cover') }}</Label>
              <div v-if="formData.cover_image" class="relative aspect-video rounded-md overflow-hidden border group">
                <SecureImage :src="formData.cover_image" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    @click="formData.cover_image = null"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    {{ $t('trip_drawer.actions.delete') }}
                  </Button>
                </div>
              </div>
              <div v-else class="flex items-center justify-center w-full">
                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <Loader2 v-if="uploadingCover" class="h-8 w-8 text-muted-foreground animate-spin" />
                    <template v-else>
                        <Upload class="w-8 h-8 mb-2 text-muted-foreground" />
                        <p class="text-sm text-muted-foreground font-medium">{{ $t('trip_drawer.cover.cta') }}</p>
                        <p class="text-xs text-muted-foreground">{{ $t('trip_drawer.cover.hint') }}</p>
                    </template>
                  </div>
                  <input type="file" class="hidden" accept="image/png, image/jpeg, image/jpg" @change="handleCoverUpload" :disabled="uploadingCover" />
                </label>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <Label class="font-bold">{{ $t('trip_drawer.itinerary.title') }}</Label>
                <Button size="sm" @click="addDestino" :disabled="!selectedCountryCode"><Plus class="h-3 w-3 mr-1" /> {{ $t('trip_drawer.itinerary.actions.add_city') }}</Button>
              </div>
              <div v-if="!formData.destinations || formData.destinations.length === 0" class="text-sm text-center py-6 border-2 border-dashed rounded-lg bg-slate-50 text-muted-foreground">
                <p v-if="!selectedCountryCode">{{ $t('trip_drawer.itinerary.empty.select_country_first') }}</p>
                <p v-else>{{ $t('trip_drawer.itinerary.empty.add_cities') }}</p>
              </div>
              <div v-for="(destino, index) in formData.destinations" :key="index" class="p-4 rounded-lg relative bg-gray-50 shadow-sm border space-y-3">
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
                    <Label class="text-xs mb-1.5 block">{{ $t('trip_drawer.itinerary.fields.city') }}</Label>
                    <Popover v-model:open="destino._isOpen">
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          role="combobox"
                          :aria-expanded="destino._isOpen"
                          class="w-full justify-between font-normal h-9"
                        >
                          <span class="truncate">{{ destino.city || $t('trip_drawer.placeholders.select_city') }}</span>
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
                              :placeholder="String($t('trip_drawer.placeholders.search_city'))"
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
                              destino.city === city.name ? 'bg-accent' : ''
                            )"
                          >
                            <Check
                              :class="cn(
                                'mr-2 h-4 w-4',
                                destino.city === city.name ? 'opacity-100' : 'opacity-0'
                              )"
                            />
                            {{ city.name }}
                          </div>
                          <div v-if="getFilteredCities(destino._citySearch || '').length === 0" class="p-4 text-center text-sm text-muted-foreground">
                            {{ $t('trip_drawer.common.not_found') }}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <!-- Dates -->
                  <div>
                    <Label class="text-xs mb-1.5 block">{{ $t('trip_drawer.itinerary.fields.arrival') }}</Label>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="cn(
                            'w-full justify-start text-left font-normal h-9',
                            !destino.start_date && 'text-muted-foreground'
                          )"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{ destino.start_date ? formatDateLong(destino.start_date) : $t('trip_drawer.placeholders.date') }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0">
                        <Calendar 
                          v-model="destino.start_date" 
                          initial-focus 
                          :min-value="startDate"
                          :max-value="endDate"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label class="text-xs mb-1.5 block">{{ $t('trip_drawer.itinerary.fields.departure') }}</Label>
                    <Popover>
                      <PopoverTrigger as-child>
                        <Button
                          variant="outline"
                          :class="cn(
                            'w-full justify-start text-left font-normal h-9',
                            !destino.end_date && 'text-muted-foreground'
                          )"
                        >
                          <CalendarIcon class="mr-2 h-4 w-4" />
                          {{ destino.end_date ? formatDateLong(destino.end_date) : $t('trip_drawer.placeholders.date') }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-auto p-0">
                        <Calendar 
                          v-model="destino.end_date" 
                          initial-focus 
                          :min-value="destino.start_date || startDate"
                          :max-value="endDate"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

                
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button type="submit" @click="handleSubmit" :disabled="loading">
          {{ loading ? $t('trip_drawer.actions.saving') : (isEditing ? $t('trip_drawer.actions.update') : $t('trip_drawer.actions.create')) }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
