<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrips } from '~/composables/useTrips'
import { Train, Plus, Trash2, ArrowRight, Ticket, Pencil, Calendar } from 'lucide-vue-next'
import { useTripOrganization, type Transporte } from '~/composables/useTripOrganization'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { formatDateTime, formatTime } from '~/utils/dates'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import { FileUploader } from '~/components/ui/FileUploader'
import { FileList } from '~/components/ui/FileList'
import { formatCurrency } from '~/utils/currency'
import { toast } from 'vue-sonner'
import { cn } from '~/lib/utils'

const route = useRoute()
const tripId = route.params.id as string
const { currentTrip } = useTrips()
const { transportes, fetchOrganizationData, createTransporte, updateTransporte, deleteTransporte } = useTripOrganization()

// Initialize generic form logic
const { 
  activeModal, 
  formData, 
  handleCreate: baseCreate, 
  handleEdit: baseEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ moneda: 'JPY', categoria: 'trayecto', escalas: [], precio: 0 }),
  createTransporte,
  updateTransporte,
  'Transporte'
)

// --- DATA SEPARATION ---

// 1. Pases (Unsorted or sorted by date)
const pases = computed(() => {
  return transportes.value
    .filter(t => t.categoria === 'pase')
    .sort((a, b) => new Date(a.fecha_inicio || '').getTime() - new Date(b.fecha_inicio || '').getTime())
})

// 2. Trayectos (Raw list)
const trayectos = computed(() => {
  return transportes.value.filter(t => t.categoria === 'trayecto')
})

// 3. Trayectos Grouped by Date (Similar to Flights)
const groupedTrayectos = computed(() => {
  if (!trayectos.value || trayectos.value.length === 0) return []
  
  // Sort by date first
  const sorted = [...trayectos.value].sort((a, b) => 
    new Date(a.fecha_inicio || '').getTime() - new Date(b.fecha_inicio || '').getTime()
  )
  
  const groups: { date: string, items: Transporte[] }[] = []
  
  sorted.forEach(t => {
    if (!t.fecha_inicio) return
    const dateKey = new Date(t.fecha_inicio).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const dateStr = dateKey.charAt(0).toUpperCase() + dateKey.slice(1)
    
    let lastGroup = groups[groups.length - 1]
    if (!lastGroup || lastGroup.date !== dateStr) {
      lastGroup = { date: dateStr, items: [] }
      groups.push(lastGroup)
    }
    lastGroup.items.push(t)
  })
  
  return groups
})

// Computed list of available passes for the selector (filtered from all transports)
const availablePasses = computed(() => {
  return transportes.value.filter(t => t.categoria === 'pase' && t.id !== formData.value.id)
})

// Watch for Pass selection to auto-set price
watch(() => formData.value.pase_id, (newVal) => {
  if (newVal && newVal !== 'none') {
    formData.value.precio = 0
  } else {
    // Optional: Reset pase_id to null explicitly if it's 'none' for cleaner logic
    if (newVal === 'none') formData.value.pase_id = null
  }
})

// Computed date limits for inputs
const dateLimits = computed(() => {
  // If a pass is selected, limit dates to the pass validity
  if (formData.value.pase_id) {
    const selectedPass = transportes.value.find(t => t.id === formData.value.pase_id)
    if (selectedPass && selectedPass.fecha_inicio && selectedPass.fecha_fin) {
      return {
        min: selectedPass.fecha_inicio,
        max: selectedPass.fecha_fin
      }
    }
  }
  
  // Default to trip dates
  return {
    min: currentTrip.value?.fecha_inicio || undefined,
    max: currentTrip.value?.fecha_fin || undefined
  }
})

const handleCreateTransport = () => {
  baseCreate()
}

const handleEditTransport = (item: any) => {
  baseEdit(item)
  if (!formData.value.escalas) formData.value.escalas = []
}

const saveTransport = () => {
  handleSave((data) => {
    // Logic to set start/end dates based on segments if it's a journey
    if (data.categoria === 'trayecto' && data.escalas?.length > 0) {
        const sorted = [...data.escalas].sort((a: any, b: any) => new Date(a.fecha_salida).getTime() - new Date(b.fecha_salida).getTime())
        data.fecha_inicio = sorted[0].fecha_salida
        data.fecha_fin = sorted[sorted.length - 1].fecha_llegada
    }
    
    // Ensure pase_id is handled correctly (Directus M2O expects ID or null)
    if (data.pase_id === 'none' || data.pase_id === '') {
       data.pase_id = null
    }

    data.viaje_id = parseInt(tripId)
    return data
  })
}

onMounted(() => {
  fetchOrganizationData(tripId)
})

const addEscala = () => {
  if (!formData.value.escalas) formData.value.escalas = []
  formData.value.escalas.push({ origen: '', destino: '', medio: '', fecha_salida: '', fecha_llegada: '' })
}

const removeEscala = (index: number) => {
  formData.value.escalas.splice(index, 1)
}

const isValid = computed(() => {
  if (!formData.value.nombre) return false
  if (formData.value.categoria === 'pase') {
    return formData.value.fecha_inicio && formData.value.fecha_fin
  } else {
    // Trayecto
    if (!formData.value.escalas || formData.value.escalas.length === 0) return false
    return formData.value.escalas.every((e: any) => e.origen && e.destino && e.fecha_salida)
  }
})

const getPassName = (passId: number) => {
  const pass = transportes.value.find(t => t.id === passId)
  return pass ? pass.nombre : 'Pase Desconocido'
}

const onFileUploaded = () => fetchOrganizationData(tripId)
</script>

<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Transporte</h2>
        <p class="text-muted-foreground">Trenes, autobuses y pases de transporte.</p>
      </div>
      <Button @click="handleCreateTransport"><Plus class="mr-2 h-4 w-4" /> Nuevo Transporte</Button>
    </div>

    <div v-if="transportes.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
      <Train class="mx-auto h-12 w-12 text-slate-300 mb-4" />
      <h3 class="text-lg font-semibold text-slate-700">No hay transportes registrados</h3>
      <p class="max-w-md mx-auto mt-2">Añade trenes, autobuses o pases de transporte.</p>
    </div>

    <div v-else class="space-y-8">
      
      <!-- SECCIÓN PASES (GRID) -->
      <div v-if="pases.length > 0">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
          <Ticket class="h-5 w-5 text-purple-600" /> Pases Activos
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card v-for="t in pases" :key="t.id" class="border-purple-100 bg-purple-50/30">
            <CardHeader class="flex flex-row items-start justify-between pb-2">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                   <Ticket class="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle class="text-base text-purple-900">{{ t.nombre }}</CardTitle>
                  <p class="text-xs font-medium text-purple-600 mt-1">
                    {{ formatDateTime(t.fecha_inicio) }} - {{ formatDateTime(t.fecha_fin) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-700">{{ formatCurrency(t.precio, t.moneda) }}</span>
                <div class="flex gap-0">
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-purple-700" @click="handleEditTransport(t)">
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-red-600" @click="deleteTransporte(t.id)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
               <div class="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-purple-100/50 mt-2">
                  <span>Archivos adjuntos</span>
                  <FileUploader collection="transportes" :item-id="t.id" @uploaded="onFileUploaded" minimal />
               </div>
               <FileList :files="t.adjuntos" class="mt-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- SECCIÓN TRAYECTOS (LISTA AGRUPADA) -->
      <div v-if="groupedTrayectos.length > 0">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
          <Train class="h-5 w-5 text-green-600" /> Itinerario de Viajes
        </h3>
        
        <div class="space-y-6">
          <div v-for="(group, gIndex) in groupedTrayectos" :key="gIndex">
             <!-- Date Header -->
             <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur py-2 px-4 z-10 rounded-2xl">
                <Calendar class="h-3 w-3" /> {{ group.date }}
             </h4>

             <div class="space-y-3">
                <Card v-for="t in group.items" :key="t.id" class="hover:shadow-md transition-shadow">
                  <CardHeader class="flex flex-row items-start justify-between pb-2">
                    <div class="flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center border border-green-100 mt-1">
                         <Train class="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <CardTitle class="text-base">{{ t.nombre }}</CardTitle>
                          <!-- Badge for Linked Pass -->
                          <span v-if="t.pase_id" class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                            <Ticket class="h-3 w-3" /> Incluido en {{ getPassName(t.pase_id) }}
                          </span>
                        </div>
                        <p class="text-sm text-muted-foreground mt-0.5">
                           Salida: {{ formatTime(t.fecha_inicio) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <span v-if="t.pase_id" class="text-xs font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">Incluido</span>
                      <span v-else class="font-bold">{{ formatCurrency(t.precio, t.moneda) }}</span>
                      
                      <div class="flex gap-0">
                        <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-green-700" @click="handleEditTransport(t)">
                          <Pencil class="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-red-600" @click="deleteTransporte(t.id)">
                          <Trash2 class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <!-- Escalas -->
                    <div v-if="t.escalas && t.escalas.length > 0" class="mb-4 pl-3 border-l-2 border-slate-200 space-y-2 ml-2">
                        <div v-for="(e, i) in t.escalas" :key="i" class="text-xs grid grid-cols-[1fr_auto] gap-2 py-1">
                            <div>
                              <span class="font-medium text-slate-700">{{ e.origen }}</span> 
                              <ArrowRight class="inline h-3 w-3 mx-1 text-slate-400" /> 
                              <span class="font-medium text-slate-700">{{ e.destino }}</span>
                              <span class="text-muted-foreground ml-2 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">{{ e.medio }}</span>
                            </div>
                            <div class="text-slate-500 font-mono">
                              {{ formatTime(e.fecha_salida) }} - {{ formatTime(e.fecha_llegada) }}
                            </div>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-dashed mt-2">
                      <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-medium text-slate-500">Archivos adjuntos</span>
                        <FileUploader collection="transportes" :item-id="t.id" @uploaded="onFileUploaded" minimal />
                      </div>
                      <FileList :files="t.adjuntos" />
                    </div>
                  </CardContent>
                </Card>
             </div>
          </div>
        </div>
      </div>

    </div>

    <!-- MODAL (Sin cambios funcionales, solo visuales) -->
    <Dialog v-model:open="activeModal">
      <DialogContent class="max-h-[90vh] overflow-y-auto" @interact-outside="(e) => { e.preventDefault() }">
        <DialogHeader><DialogTitle>{{ formData.id ? 'Editar' : 'Nuevo' }} Transporte</DialogTitle></DialogHeader>
        <div class="grid gap-4 py-4">
            <div>
              <Label>Categoría</Label>
              <Select v-model="formData.categoria">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pase">Pase (Periodo)</SelectItem>
                  <SelectItem value="trayecto">Trayecto (Ruta)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div><Label>Nombre</Label><Input v-model="formData.nombre" :placeholder="formData.categoria === 'pase' ? 'Ej: JR Pass 7 Días' : 'Ej: Ruta Alpes'" /></div>

            <!-- PASE -->
            <template v-if="formData.categoria === 'pase'">
               <div class="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Inicio Validez</Label>
                    <DateTimePicker 
                      v-model="formData.fecha_inicio"
                      :min="currentTrip?.fecha_inicio || undefined"
                      :max="currentTrip?.fecha_fin || undefined"
                    />
                  </div>
                  <div>
                    <Label>Fin Validez</Label>
                    <DateTimePicker 
                      v-model="formData.fecha_fin"
                      :min="currentTrip?.fecha_inicio || undefined"
                      :max="currentTrip?.fecha_fin || undefined"
                    />
                  </div>
               </div>
            </template>

            <!-- TRAYECTO -->
            <template v-else>
               <!-- Link to Pass -->
               <div v-if="availablePasses.length > 0" class="bg-blue-50 p-3 rounded border border-blue-100">
                  <Label class="text-blue-700 font-bold mb-1 block">¿Incluido en un pase?</Label>
                  <Select v-model="formData.pase_id">
                    <SelectTrigger class="bg-white"><SelectValue placeholder="Seleccionar Pase..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno (Pago individual)</SelectItem>
                      <SelectItem v-for="pass in availablePasses" :key="pass.id" :value="pass.id">
                        {{ pass.nombre }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p v-if="formData.pase_id" class="text-xs text-blue-600 mt-1">
                    * El precio se marcará como incluido (0).
                  </p>
               </div>

               <div class="space-y-4 border rounded p-3 bg-slate-50 mt-2">
                  <div class="flex justify-between items-center">
                    <Label class="text-xs uppercase font-bold text-slate-500">Escalas / Tramos</Label>
                    <Button size="sm" variant="ghost" @click="addEscala"><Plus class="h-3 w-3 mr-1" /> Añadir</Button>
                  </div>
                  
                  <div v-if="!formData.escalas || formData.escalas.length === 0" class="text-sm text-center py-2 text-muted-foreground italic">
                     Añade al menos un tramo.
                  </div>

                  <div v-for="(escala, index) in formData.escalas" :key="index" class="space-y-2 p-3 bg-white rounded border shadow-sm relative group">
                    <button @click="removeEscala(index)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 class="h-3 w-3" /></button>
                    
                    <div class="grid grid-cols-2 gap-2">
                      <div><Label class="text-xs">Origen</Label><Input class="h-8" v-model="escala.origen" /></div>
                      <div><Label class="text-xs">Destino</Label><Input class="h-8" v-model="escala.destino" /></div>
                    </div>
                    <div><Label class="text-xs">Medio</Label><Input class="h-8" v-model="escala.medio" placeholder="Tren, Bus..." /></div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <Label class="text-xs">Salida</Label>
                        <DateTimePicker 
                          v-model="escala.fecha_salida" 
                          :min="dateLimits.min"
                          :max="dateLimits.max"
                        />
                      </div>
                      <div>
                        <Label class="text-xs">Llegada</Label>
                        <DateTimePicker 
                          v-model="escala.fecha_llegada" 
                          :min="dateLimits.min"
                          :max="dateLimits.max"
                        />
                      </div>
                    </div>
                  </div>
               </div>
            </template>

            <div class="grid grid-cols-2 gap-2">
             <div :class="{ 'opacity-50 pointer-events-none': formData.pase_id && formData.pase_id !== 'none' }">
               <Label>Precio</Label>
               <Input 
                 type="number" 
                 v-model="formData.precio" 
                 :step="formData.moneda === 'JPY' ? '1' : '0.01'"
                 :disabled="!!formData.pase_id && formData.pase_id !== 'none'"
               />
             </div>
             <div>
               <Label>Moneda</Label>
               <Select v-model="formData.moneda" :disabled="!!formData.pase_id && formData.pase_id !== 'none'">
                <SelectTrigger><SelectValue placeholder="EUR/JPY" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euros (€)</SelectItem>
                  <SelectItem value="JPY">Yenes (¥)</SelectItem>
                </SelectContent>
              </Select>
             </div>
          </div>
        </div>
        <DialogFooter><Button @click="saveTransport" :disabled="!isValid">Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>