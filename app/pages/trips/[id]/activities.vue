<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrips } from '~/composables/useTrips'
import { Ticket, Plus, Trash2, Pencil, Calendar } from 'lucide-vue-next'
import { useTripOrganization, type Actividad } from '~/composables/useTripOrganization'
import { useTripItemForm } from '~/composables/useTripItemForm'
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
import { formatTime } from '~/utils/dates'
import { toast } from 'vue-sonner'

const route = useRoute()
const tripId = route.params.id as string
const { currentTrip } = useTrips()
const { actividades, fetchOrganizationData, createActividad, updateActividad, deleteActividad } = useTripOrganization()

// Initialize generic form logic
const { 
  activeModal, 
  formData, 
  handleCreate: baseCreate, 
  handleEdit: baseEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ moneda: 'JPY', estado_pago: 'pendiente', tipo: 'entrada' }),
  createActividad,
  updateActividad,
  'Actividad'
)

onMounted(() => {
  fetchOrganizationData(tripId)
})

const handleCreateActivity = () => {
  baseCreate()
}

const handleEditActivity = (item: any) => {
  baseEdit(item)
}

const saveActivity = () => {
  handleSave((data) => {
    data.viaje_id = parseInt(tripId)
    return data
  })
}

const isValid = computed(() => formData.value.nombre && formData.value.fecha)

const onFileUploaded = () => fetchOrganizationData(tripId)

// Group Activities by Date
const groupedActivities = computed(() => {
  if (!actividades.value || actividades.value.length === 0) return []
  
  // Sort by date first
  const sorted = [...actividades.value].sort((a, b) => 
    new Date(a.fecha || '').getTime() - new Date(b.fecha || '').getTime()
  )
  
  const groups: { date: string, items: Actividad[] }[] = []
  
  sorted.forEach(a => {
    if (!a.fecha) return
    const dateKey = new Date(a.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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
        <h2 class="text-2xl font-bold tracking-tight">Actividades</h2>
        <p class="text-muted-foreground">Entradas a museos, parques y eventos.</p>
      </div>
      <Button @click="handleCreateActivity"><Plus class="mr-2 h-4 w-4" /> Nueva Actividad</Button>
    </div>

    <div v-if="actividades.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
      <Ticket class="mx-auto h-12 w-12 text-slate-300 mb-4" />
      <h3 class="text-lg font-semibold text-slate-700">No hay actividades registradas</h3>
      <p class="max-w-md mx-auto mt-2">Planifica tus visitas a museos, parques y eventos.</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(group, index) in groupedActivities" :key="index">
         <!-- Date Header -->
         <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur py-2 px-4 z-10 rounded-2xl">
            <Calendar class="h-3 w-3" /> {{ group.date }}
         </h4>

         <div class="space-y-3">
            <Card v-for="a in group.items" :key="a.id" class="hover:shadow-md transition-shadow">
              <CardHeader class="flex flex-row items-start justify-between pb-2">
                <div class="flex items-center gap-2">
                  <div class="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 mt-1">
                     <Ticket class="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle class="text-base">{{ a.nombre }}</CardTitle>
                    <p class="text-sm text-muted-foreground">{{ a.fecha ? formatTime(a.fecha) : 'Sin hora' }} • <span class="capitalize">{{ a.tipo }}</span></p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-bold">{{ formatCurrency(a.precio, a.moneda) }}</span>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" @click="handleEditActivity(a)">
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" class="text-destructive hover:text-red-600" @click="deleteActividad(a.id)">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div class="pt-3 border-t border-dashed mt-2">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-medium text-slate-500">Archivos adjuntos</span>
                    <FileUploader collection="actividades" :item-id="a.id" @uploaded="onFileUploaded" minimal />
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
        <DialogHeader><DialogTitle>{{ formData.id ? 'Editar' : 'Nueva' }} Actividad</DialogTitle></DialogHeader>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <Label>Nombre Actividad</Label>
                <Input v-model="formData.nombre" />
              </div>
              <div class="col-span-1">
                <Label>Estado Pago</Label>
                <Select v-model="formData.estado_pago" class="w-full">
                   <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="pagado">Pagado</SelectItem>
                     <SelectItem value="pendiente">Pendiente</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Fecha</Label>
              <DateTimePicker v-model="formData.fecha" 
                :min="currentTrip?.fecha_inicio || undefined"
                :max="currentTrip?.fecha_fin || undefined"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select v-model="formData.tipo">
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="restauracion">Comida/Bebida</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-2 gap-2">
             <div>
               <Label>Precio</Label>
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
        <DialogFooter><Button @click="saveActivity" :disabled="!isValid">Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
