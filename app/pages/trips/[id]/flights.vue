<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Plane, Plus, Trash2, Edit2, ArrowRight, Calendar } from 'lucide-vue-next'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTrips } from '~/composables/useTrips'
import { useAirlines } from '~/composables/useAirlines'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { formatDateTime, formatTime, getDayDiff } from '~/utils/dates'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { AirlineSelector } from '~/components/ui/AirlineSelector'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import { FileUploader } from '~/components/ui/FileUploader'
import { FileList } from '~/components/ui/FileList'
import { formatCurrency } from '~/utils/currency'
import { groupByDate } from '~/utils/grouping'
import { toast } from 'vue-sonner'

const route = useRoute()
const tripId = route.params.id as string

const { currentTrip } = useTrips()
const { vuelos, fetchOrganizationData, createVuelo, updateVuelo, deleteVuelo } = useTripOrganization()
const { airlines, fetchAirlines } = useAirlines()

// Initialize generic form logic
const { 
  activeModal, 
  formData, 
  handleCreate: baseCreate, 
  handleEdit: baseEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ moneda: 'EUR', escalas: [] }),
  createVuelo,
  updateVuelo,
  'Vuelo'
)

// Wrappers
const handleCreateFlight = () => {
  baseCreate()
}

const handleEditFlight = (v: any) => {
  baseEdit(v)
  if (!formData.value.escalas) formData.value.escalas = []
}

const saveFlight = () => {
  handleSave((data) => {
     // Validate at least one segment
     if (!data.escalas || data.escalas.length === 0) {
         toast.error('Debes añadir al menos un trayecto')
         throw new Error('Validation failed')
     }

     // Auto-calculate globals from segments
     const sorted = [...data.escalas].sort((a: any, b: any) => new Date(a.fecha_salida).getTime() - new Date(b.fecha_salida).getTime())
     
     data.fecha_salida = sorted[0].fecha_salida
     data.fecha_llegada = sorted[sorted.length - 1].fecha_llegada
     data.origen = sorted[0].origen
     data.destino = sorted[sorted.length - 1].destino
     data.aerolinea = sorted[0].aerolinea

     // Default title if empty
     if (!data.titulo) {
         data.titulo = `${data.origen} ➝ ${data.destino}`
     }
     
     data.viaje_id = parseInt(tripId)
     return data
  })
}

onMounted(() => {
  fetchOrganizationData(tripId)
  fetchAirlines()
})

const getAirlineLogo = (name: string) => {
  if (!name) return null
  const airline = airlines.value.find(a => a.name === name)
  return airline?.logo || null
}

const addEscala = () => {
  if (!formData.value.escalas) formData.value.escalas = []
  
  // Auto-fill logic based on previous segment
  let prevDest = ''
  let prevDate = ''
  if (formData.value.escalas.length > 0) {
      const last = formData.value.escalas[formData.value.escalas.length - 1]
      prevDest = last.destino || ''
      // Suggest next flight 2 hours later
      if (last.fecha_llegada) {
        try {
           const d = new Date(last.fecha_llegada)
           d.setHours(d.getHours() + 2)
           prevDate = d.toISOString().slice(0, 16)
        } catch(e) {}
      }
  }

  formData.value.escalas.push({ 
    origen: prevDest, 
    destino: '', 
    aerolinea: '', 
    numero_vuelo: '', 
    terminal: '',
    fecha_salida: prevDate, 
    fecha_llegada: '' 
  })
}

const removeEscala = (index: number) => {
  formData.value.escalas.splice(index, 1)
}

const isValid = computed(() => {
  if (!formData.value.titulo) return false
  if (!formData.value.escalas || formData.value.escalas.length === 0) return false
  return formData.value.escalas.every((e: any) => e.origen && e.destino && e.fecha_salida)
})

const getEscalasGrouped = (escalas?: any[]) => groupByDate(escalas, 'fecha_salida')

const onFileUploaded = () => fetchOrganizationData(tripId) 
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Vuelos</h2>
        <p class="text-muted-foreground">Gestiona tus billetes aéreos y reservas.</p>
      </div>
      <Button @click="handleCreateFlight"><Plus class="mr-2 h-4 w-4" /> Nuevo Vuelo</Button>
    </div>

    <div v-if="vuelos.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
      <Plane class="mx-auto h-12 w-12 text-slate-300 mb-4" />
      <h3 class="text-lg font-semibold text-slate-700">No hay vuelos registrados</h3>
      <p class="max-w-md mx-auto mt-2">Añade tus vuelos para organizar el itinerario de viaje.</p>
    </div>

    <div v-else class="space-y-4">
      <Card v-for="v in vuelos" :key="v.id">
        <CardHeader class="flex flex-row items-start justify-between pb-2">
          <div class="flex items-center gap-3">
            <Plane class="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <div class="flex items-center gap-2">
                 <!-- Título Principal -->
                 <CardTitle class="text-base font-bold flex items-center gap-2">
                   {{ v.titulo || `${v.origen} ➝ ${v.destino}` }}
                 </CardTitle>
                 <!-- Precio debajo del título -->
                 <div class="text-sm font-medium text-slate-600">
                    {{ formatCurrency(v.precio, v.moneda) }}
                 </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Localizador a la derecha -->
            <div v-if="v.codigo_reserva" class="bg-blue-100 text-blue-700 font-mono font-bold px-2 py-1 rounded text-sm mr-2 border border-blue-200">
               {{ v.codigo_reserva }}
            </div>
            <Button variant="ghost" size="icon" @click="handleEditFlight(v)"><Edit2 class="h-4 w-4 text-slate-500" /></Button>
            <Button variant="ghost" size="icon" class="text-destructive hover:text-red-600" @click="deleteVuelo(v.id)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Escalas Display -->
          <div v-if="v.escalas && v.escalas.length > 0" class="mt-4">
            <div v-for="(group, gIndex) in getEscalasGrouped(v.escalas)" :key="gIndex" class="mb-4 last:mb-0">
               <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1 flex items-center gap-2">
                  <Calendar class="h-3 w-3" /> {{ group.date }}
               </h4>
               <div class="space-y-3">
                  <Card v-for="(escala, i) in group.items" :key="i" class="border shadow-sm bg-slate-50/50">
                    <CardContent class="p-4 flex items-center justify-between">
                      <div class="flex items-center gap-4">
                        <!-- Logo Aerolínea -->
                        <div class="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-white rounded-md border p-1 shadow-sm">
                            <img 
                              v-if="getAirlineLogo(escala.aerolinea)" 
                              :src="getAirlineLogo(escala.aerolinea)" 
                              class="h-full w-full object-contain"
                              alt=""
                            />
                            <Plane v-else class="h-5 w-5 text-slate-300" />
                        </div>
                        
                        <!-- Detalles Trayecto -->
                        <div>
                          <div class="flex items-center gap-2 font-bold text-base text-slate-800">
                              <span class="text-slate-500 font-normal text-sm">{{ formatTime(escala.fecha_salida) }}</span>
                              <span>{{ escala.origen }}</span>
                              <ArrowRight class="h-4 w-4 text-muted-foreground mx-1" />
                              <span>{{ escala.destino }}</span>
                              <span class="text-slate-500 font-normal text-sm ml-1" v-if="escala.fecha_llegada">
                                {{ formatTime(escala.fecha_llegada) }}
                                <sup v-if="getDayDiff(escala.fecha_salida, escala.fecha_llegada)" class="text-xs text-red-500 font-bold ml-0.5">{{ getDayDiff(escala.fecha_salida, escala.fecha_llegada) }}</sup>
                              </span>
                          </div>
                          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              <div v-if="escala.aerolinea" class="font-medium text-slate-700">
                                {{ escala.aerolinea }}
                              </div>
                              <div v-if="escala.numero_vuelo" class="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">
                                {{ escala.numero_vuelo }}
                              </div>
                              <div v-if="escala.terminal" class="text-xs border px-1.5 py-0.5 rounded bg-white">
                                T: {{ escala.terminal }}
                              </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Número de Escala (Decorativo) -->
                      <div class="text-xs font-mono text-slate-300 font-bold hidden sm:block">
                        #{{ i + 1 }}
                      </div>
                    </CardContent>
                  </Card>
               </div>
            </div>
          </div>

          <div class="pt-4 border-t mt-8">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">Archivos adjuntos</span>
              <FileUploader collection="vuelos" :item-id="v.id" @uploaded="onFileUploaded" />
            </div>
            <FileList :files="v.adjuntos" />
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="activeModal">
      <DialogContent 
        class="max-h-[90vh] overflow-y-auto sm:max-w-[650px]"
        @interact-outside="(e) => { e.preventDefault() }"
      >
        <DialogHeader>
            <DialogTitle>{{ formData.id ? 'Editar Itinerario' : 'Nuevo Vuelo' }}</DialogTitle>
        </DialogHeader>
        
        <div class="grid gap-4 py-4">
            <!-- Título del Vuelo -->
            <div class="grid grid-cols-[2fr_1fr] gap-4">
              <div>
                <Label class="text-base font-bold">Título del Viaje</Label>
                <Input v-model="formData.titulo" placeholder="Ej: Vuelo Ida a Japón" class="font-medium" />
                <p class="text-xs text-muted-foreground mt-1">Nombre general para identificar este itinerario.</p>
              </div>
              <div>
                <Label class="text-base font-bold">Localizador</Label>
                <Input v-model="formData.codigo_reserva" placeholder="Ej: A1B2C3" class="font-mono uppercase" />
                <p class="text-xs text-muted-foreground mt-1">Código de reserva.</p>
              </div>
            </div>

            <!-- Escalas Section -->
            <div class="space-y-3 border-t pt-4">
               <div class="flex justify-between items-center">
                  <Label class="font-bold">Trayectos / Escalas</Label>
                  <Button size="sm" variant="outline" @click="addEscala"><Plus class="h-3 w-3 mr-1" /> Añadir Trayecto</Button>
               </div>
               
               <div v-if="!formData.escalas || formData.escalas.length === 0" class="text-sm text-center py-6 border-2 border-dashed rounded-lg bg-slate-50 text-muted-foreground">
                  <p>Añade al menos un trayecto para definir el vuelo.</p>
                  <Button variant="link" size="sm" @click="addEscala">Añadir primero</Button>
               </div>

               <div v-for="(escala, index) in formData.escalas" :key="index" class="p-4 border rounded-lg relative bg-white shadow-sm space-y-3 transition-all hover:border-blue-300">
                  <div class="flex justify-between items-center mb-2 border-b pb-2">
                      <span class="font-bold text-sm text-slate-600 flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs">{{ index + 1 }}</div>
                        Trayecto
                      </span>
                      <button @click="removeEscala(index)" class="text-slate-400 hover:text-red-500 transition-colors"><Trash2 class="h-4 w-4" /></button>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <div><Label class="text-xs">Origen</Label><Input class="h-9" v-model="escala.origen" placeholder="Ciudad Origen" /></div>
                    <div><Label class="text-xs">Destino</Label><Input class="h-9" v-model="escala.destino" placeholder="Ciudad Destino" /></div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                     <div>
                       <Label class="text-xs">Salida</Label>
                       <DateTimePicker 
                         v-model="escala.fecha_salida" 
                         :min="currentTrip?.fecha_inicio || undefined"
                         :max="currentTrip?.fecha_fin || undefined"
                       />
                     </div>
                     <div>
                       <Label class="text-xs">Llegada</Label>
                       <DateTimePicker 
                         v-model="escala.fecha_llegada" 
                         :min="currentTrip?.fecha_inicio || undefined"
                         :max="currentTrip?.fecha_fin || undefined"
                       />
                     </div>
                  </div>
                  
                  <div class="grid grid-cols-[2fr_1fr_1fr] gap-3">
                     <div><Label class="text-xs">Aerolínea</Label><AirlineSelector v-model="escala.aerolinea" /></div>
                     <div><Label class="text-xs">Nº Vuelo</Label><Input class="h-9" v-model="escala.numero_vuelo" placeholder="IB6800" /></div>
                     <div><Label class="text-xs">Terminal</Label><Input class="h-9" v-model="escala.terminal" placeholder="T4" /></div>
                  </div>
               </div>
            </div>

            <!-- Price -->
            <div class="grid grid-cols-[2fr_1fr] gap-3 pt-4">
             <div>
               <Label>Precio Total</Label>
               <Input 
                 type="number" 
                 v-model="formData.precio" 
                 :step="formData.moneda === 'JPY' ? '1' : '0.01'" 
               />
             </div>
             <div>
               <Label>Moneda</Label>
               <Select v-model="formData.moneda">
                <SelectTrigger><SelectValue placeholder="EUR/JPY" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euros (€)</SelectItem>
                  <SelectItem value="JPY">Yenes (¥)</SelectItem>
                </SelectContent>
              </Select>
             </div>
          </div>
        </div>
        <DialogFooter><Button @click="saveFlight" :disabled="!isValid">Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>