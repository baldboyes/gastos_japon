<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Hotel, Plus, Trash2, Pencil, MapPin, Calendar, Users } from 'lucide-vue-next'
import { useTripOrganization, type Alojamiento } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { getStatusColor, getStatusLabel } from '~/utils/trip-status'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import { LocationSelector } from '~/components/ui/LocationSelector'
import { FileUploader } from '~/components/ui/FileUploader'
import { FileList } from '~/components/ui/FileList'
import { formatCurrency } from '~/utils/currency'
import { cn } from '~/lib/utils'

const route = useRoute()
const tripId = route.params.id as string

const { currentTrip, getTrip } = useTrips()
const { alojamientos, fetchOrganizationData, createAlojamiento, updateAlojamiento, deleteAlojamiento } = useTripOrganization()

// Initialize generic form logic
const { 
  activeModal, 
  formData, 
  handleCreate: baseCreate, 
  handleEdit: baseEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ moneda: 'JPY', estado_pago: 'pagado' }),
  createAlojamiento,
  updateAlojamiento,
  'Alojamiento'
)

// Location logic specific to Accommodation
const locationData = ref({
  prefecture: '',
  city: '',
  latitude: 0,
  longitude: 0,
  address: ''
})

// Sync address to formData
watch(() => locationData.value.address, (newVal) => {
  if (newVal) {
    formData.value.direccion = newVal
  }
})

// Wrappers to handle Location Data
const handleCreateAccommodation = () => {
  baseCreate()
  locationData.value = { prefecture: '', city: '', latitude: 0, longitude: 0, address: '' }
}

const handleEditAccommodation = (item: any) => {
  baseEdit(item)
  locationData.value = {
    prefecture: item.prefectura || '',
    city: item.ciudad || '',
    latitude: item.latitud || 0,
    longitude: item.longitud || 0,
    address: item.direccion || ''
  }
}

const saveAccommodation = () => {
  handleSave((data) => {
    const payload = {
      ...data,
      viaje_id: parseInt(tripId)
    }
    // Add location fields if present
    if (locationData.value.prefecture) payload.prefectura = locationData.value.prefecture
    if (locationData.value.city) payload.ciudad = locationData.value.city
    if (locationData.value.latitude) payload.latitud = locationData.value.latitude
    if (locationData.value.longitude) payload.longitud = locationData.value.longitude
    
    return payload
  })
}

onMounted(() => {
  fetchOrganizationData(tripId)
  if (!currentTrip.value || currentTrip.value.id !== tripId) {
    getTrip(tripId)
  }
})

const isValid = computed(() => {
  return formData.value.nombre && formData.value.check_in && formData.value.check_out
})

const onFileUploaded = () => fetchOrganizationData(tripId)

const getCreatorName = (user: any) => {
  if (!user) return ''
  if (typeof user === 'string') return '' 
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name.charAt(0)}.`
  }
  return user.first_name || ''
}

const getCreatorAvatar = (user: any) => {
  if (!user || typeof user === 'string') return null
  return user.avatar_url || null
}

// Group Accommodations by Date (Check-in)
const groupedAccommodations = computed(() => {
  if (!alojamientos.value || alojamientos.value.length === 0) return []
  
  // Sort by check-in date
  const sorted = [...alojamientos.value].sort((a, b) => 
    new Date(a.check_in || '').getTime() - new Date(b.check_in || '').getTime()
  )
  
  const groups: { date: string, items: Alojamiento[] }[] = []
  
  sorted.forEach(a => {
    if (!a.check_in) return
    const dateKey = new Date(a.check_in).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const dateStr = dateKey.charAt(0).toUpperCase() + dateKey.slice(1)
    
    let lastGroup = groups[groups.length - 1]
    if (!lastGroup || lastGroup.date !== dateStr) {
      lastGroup = { date: dateStr, items: [] }
      groups.push(lastGroup)
    }
    lastGroup.items.push(a)
  })
  
  return groups
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Alojamiento</h2>
        <p class="text-muted-foreground">Hoteles, ryokans y apartamentos.</p>
      </div>
      <Button @click="handleCreateAccommodation"><Plus class="mr-2 h-4 w-4" /> Nuevo Alojamiento</Button>
    </div>

    <div v-if="alojamientos.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
      <Hotel class="mx-auto h-12 w-12 text-slate-300 mb-4" />
      <h3 class="text-lg font-semibold text-slate-700">No hay alojamientos registrados</h3>
      <p class="max-w-md mx-auto mt-2">Guarda tus reservas de hotel para tenerlas localizadas.</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(group, index) in groupedAccommodations" :key="index">
         <!-- Date Header -->
         <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur py-2 px-4 z-10 rounded-2xl">
            <Calendar class="h-3 w-3" /> {{ group.date }}
         </h4>

         <div class="space-y-3">
            <Card v-for="a in group.items" :key="a.id" class="hover:shadow-md transition-shadow">
              <CardHeader class="flex flex-row items-start justify-between pb-2">
                <div class="flex items-center gap-2">
                  <Hotel class="h-5 w-5 text-orange-500" />
                  <div>
                    <CardTitle class="text-base">{{ a.nombre }}</CardTitle>
                    <div class="flex items-center gap-2 mt-1">
                      <p class="text-sm text-muted-foreground">{{ new Date(a.check_in).toLocaleDateString() }} - {{ new Date(a.check_out).toLocaleDateString() }}</p>
                      <span v-if="a.estado_pago" :class="cn('text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide', getStatusColor(a.estado_pago))">
                        {{ getStatusLabel(a.estado_pago) }}
                      </span>
                      <span v-if="getCreatorName(a.user_created)" class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border flex items-center gap-1">
                        <img 
                          v-if="getCreatorAvatar(a.user_created)" 
                          :src="getCreatorAvatar(a.user_created)" 
                          class="h-3 w-3 rounded-full object-cover" 
                          alt="" 
                        />
                        <Users v-else class="h-3 w-3" />
                        {{ getCreatorName(a.user_created) }}
                      </span>
                    </div>
                    <p v-if="a.ciudad || a.prefectura" class="text-xs font-medium text-slate-600 mt-1">
                      📍 {{ [a.ciudad, a.prefectura].filter(Boolean).join(', ') }}
                    </p>
                    <p v-if="a.direccion" class="text-xs text-muted-foreground mt-0.5">{{ a.direccion }}</p>
                    <p v-if="a.enlace_google" class="mt-1">
                      <a :href="a.enlace_google" target="_blank" class="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <MapPin class="h-3 w-3" /> Ver en Google Maps
                      </a>
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-bold">{{ formatCurrency(a.precio, a.moneda) }}</span>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" @click="handleEditAccommodation(a)">
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" class="text-destructive hover:text-red-600" @click="deleteAlojamiento(a.id)">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div class="pt-3 border-t border-dashed mt-2">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-medium text-slate-500">Archivos adjuntos</span>
                    <FileUploader collection="alojamientos" :item-id="a.id" @uploaded="onFileUploaded" minimal />
                  </div>
                  <FileList :files="a.adjuntos" />
                </div>
              </CardContent>
            </Card>
         </div>
      </div>
    </div>

    <Dialog v-model:open="activeModal">
      <DialogContent @interact-outside="(e) => { e.preventDefault() }">
        <DialogHeader><DialogTitle>{{ formData.id ? 'Editar' : 'Nuevo' }} Alojamiento</DialogTitle></DialogHeader>
        <div class="grid gap-4 py-4">

            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <Label>Nombre Hotel</Label><Input v-model="formData.nombre" />
              </div>
              <div class="col-span-1">
                <Label>Estado Pago</Label>
                <Select v-model="formData.estado_pago" class="w-full">
                   <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="pagado">Pagado</SelectItem>
                     <SelectItem value="pendiente">Pendiente</SelectItem>
                     <SelectItem value="parcial">Parcial</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>
            <LocationSelector v-model="locationData" />
            <div class="grid grid-cols-2 gap-2">
              <div>
                <Label>Check-in</Label>
                <DateTimePicker 
                  v-model="formData.check_in" 
                  :min="currentTrip?.fecha_inicio ?? undefined"
                  :max="currentTrip?.fecha_fin ?? undefined"
                  default-time="15:00"
                />
              </div>
              <div>
                <Label>Check-out</Label>
                <DateTimePicker 
                  v-model="formData.check_out" 
                  :min="currentTrip?.fecha_inicio ?? undefined"
                  :max="currentTrip?.fecha_fin ?? undefined"
                  default-time="10:00"
                />
              </div>
            </div>
            <div class="hidden"><Label>Dirección (Calle, número...)</Label><Input v-model="formData.direccion" /></div>
            <div>
              <Label>Enlace Google Maps</Label>
              <Input v-model="formData.enlace_google" placeholder="https://maps.google.com/..." />
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <Label>Precio</Label>
                <Input 
                  type="number" 
                  v-model="formData.precio" 
                  :step="formData.moneda === 'JPY' ? '1' : '0.01'"
                />
              </div>
              <div class="col-span-1">
                <Label>Moneda</Label>
                <Select v-model="formData.moneda" class="w-full">
                  <SelectTrigger><SelectValue placeholder="EUR/JPY" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euros (€)</SelectItem>
                    <SelectItem value="JPY">Yenes (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>
        <DialogFooter>
          <Button @click="saveAccommodation" :disabled="!isValid">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>