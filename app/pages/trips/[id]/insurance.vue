<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrips } from '~/composables/useTrips'
import { Shield, Plus, Trash2, Pencil } from 'lucide-vue-next'
import { useTripOrganization, type Seguro } from '~/composables/useTripOrganization'
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
import { formatPhoneNumber, formatPhoneForHref } from '~/utils/phone'
import { toast } from 'vue-sonner'

const route = useRoute()
const tripId = route.params.id as string
const { currentTrip } = useTrips()
const { seguros, fetchOrganizationData, createSeguro, updateSeguro, deleteSeguro } = useTripOrganization()

// Initialize generic form logic
const { 
  activeModal, 
  formData, 
  handleCreate: baseCreate, 
  handleEdit: baseEdit, 
  handleSave 
} = useTripItemForm(
  () => ({ moneda: 'EUR' }),
  createSeguro,
  updateSeguro,
  'Seguro'
)

onMounted(() => {
  fetchOrganizationData(tripId)
})

const handleCreateInsurance = () => {
  baseCreate()
}

const handleEditInsurance = (item: any) => {
  baseEdit(item)
}

const saveInsurance = () => {
  handleSave((data) => {
    data.viaje_id = parseInt(tripId)
    return data
  })
}

const isValid = computed(() => formData.value.compania && formData.value.tipo)

const onFileUploaded = () => fetchOrganizationData(tripId)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Seguros</h2>
        <p class="text-muted-foreground">Pólizas de salud y cancelación.</p>
      </div>
      <Button @click="handleCreateInsurance"><Plus class="mr-2 h-4 w-4" /> Nuevo Seguro</Button>
    </div>

    <div v-if="seguros.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
      <Shield class="mx-auto h-12 w-12 text-slate-300 mb-4" />
      <h3 class="text-lg font-semibold text-slate-700">No hay seguros contratados</h3>
      <p class="max-w-md mx-auto mt-2">Añade tu seguro de viaje para tener la documentación a mano.</p>
    </div>

    <div v-else class="space-y-4">
      <Card v-for="s in seguros" :key="s.id">
        <CardHeader class="flex flex-row items-start justify-between pb-2">
          <div class="flex items-center gap-2">
            <Shield class="h-5 w-5 text-red-500" />
            <div>
              <CardTitle class="text-base">{{ s.compania }}</CardTitle>
              <p class="text-sm text-muted-foreground capitalize">{{ s.tipo }} • Póliza: {{ s.numero_poliza }}</p>
              <div class="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                 <span v-if="s.telefono_urgencias">Tel: <a :href="'tel:' + formatPhoneForHref(s.telefono_urgencias)">{{ formatPhoneNumber(s.telefono_urgencias) }}</a></span>
                 <span v-if="s.email_urgencias">Email: <a :href="'mailto:' + s.email_urgencias">{{ s.email_urgencias }}</a></span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-bold">{{ formatCurrency(s.precio, s.moneda) }}</span>
            <div class="flex gap-1">
              <Button variant="ghost" size="icon" @click="handleEditInsurance(s)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" class="text-destructive hover:text-red-600" @click="deleteSeguro(s.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="pt-4 border-t mt-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">Póliza / Documentos</span>
              <FileUploader collection="seguros" :item-id="s.id" @uploaded="onFileUploaded" />
            </div>
            <FileList :files="s.adjuntos" />
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="activeModal">
      <DialogContent @interact-outside="(e) => { e.preventDefault() }">
        <DialogHeader><DialogTitle>{{ formData.id ? 'Editar' : 'Nuevo' }} Seguro</DialogTitle></DialogHeader>
        <div class="grid gap-4 py-4">
            <div><Label>Compañía</Label><Input v-model="formData.compania" placeholder="Ej: IATI" /></div>
            <div>
              <Label>Tipo</Label>
              <Select v-model="formData.tipo">
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salud">Salud</SelectItem>
                  <SelectItem value="cancelacion">Cancelación</SelectItem>
                  <SelectItem value="completo">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div><Label>Nº Póliza</Label><Input v-model="formData.numero_poliza" /></div>
              <div><Label>Tel. Urgencias</Label><Input v-model="formData.telefono_urgencias" /></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <Label>Inicio</Label>
                <DateTimePicker 
                  v-model="formData.fecha_inicio"
                  :min="currentTrip?.fecha_inicio || undefined"
                  :max="currentTrip?.fecha_fin || undefined"
                />
              </div>
              <div>
                <Label>Fin</Label>
                <DateTimePicker 
                  v-model="formData.fecha_fin"
                  :min="currentTrip?.fecha_inicio || undefined"
                  :max="currentTrip?.fecha_fin || undefined"
                />
              </div>
            </div>
            <div><Label>Email Urgencias</Label><Input v-model="formData.email_urgencias" placeholder="ejemplo@seguro.com" /></div>
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
        <DialogFooter><Button @click="saveInsurance" :disabled="!isValid">Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
