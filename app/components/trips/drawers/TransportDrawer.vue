<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useTripOrganization, type Transporte, type Escala } from '~/composables/useTripOrganization'
  import { useTripItemForm } from '~/composables/useTripItemForm'
  import { addDays, addHours, formatDateTime, formatDate } from '~/utils/dates'
  import { differenceInDays, differenceInHours } from 'date-fns'
  import { 
    Drawer, 
    DrawerContent, 
    DrawerHeader, 
    DrawerTitle, 
    DrawerFooter,
    DrawerDescription 
  } from '~/components/ui/drawer'
  import { Button } from '~/components/ui/button'
  import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import CurrencySelector from '~/components/ui/CurrencySelector/CurrencySelector.vue'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import FileUploader from '~/components/ui/FileUploader/FileUploader.vue'
  import FileList from '~/components/ui/FileList/FileList.vue'
  import { useDirectus } from '~/composables/useDirectus'
  import { readItem } from '@directus/sdk'
  import { Plus, Trash2 } from 'lucide-vue-next'
  import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'

  const props = defineProps<{
    open: boolean
    tripId: string | number
    currentTrip?: any
    itemToEdit?: any
  }>()

  const emit = defineEmits(['update:open', 'saved'])
  const { t } = useI18n()

  const { createTransporte, updateTransporte } = useTripOrganization()
  const { getAuthenticatedClient } = useDirectus()

  type FormState = Omit<Partial<Transporte>, 'moneda' | 'escalas'> & {
    duracion_cantidad?: number
    moneda: string
    escalas: Escala[]
    pase_id?: number | null
  }

  const { transportes } = useTripOrganization()

  const availablePasses = computed(() => {
    return transportes.value.filter(t => t.categoria === 'pase')
  })

  // Initialize generic form logic
  const { 
    formData, 
    handleCreate, 
    handleEdit, 
    handleSave 
  } = useTripItemForm<FormState>(
    () => ({ 
      moneda: props.currentTrip?.moneda || 'JPY', 
      categoria: 'trayecto', 
      escalas: [] as Escala[], 
      precio: 0, 
      estado_pago: 'pendiente', 
      tipo_duracion: 'dias',
      duracion_cantidad: 1,
      pase_id: null
    } as FormState),
    createTransporte,
    updateTransporte,
    String(t('trip_transport_drawer.item_label'))
  )

  // Sync open state
  const isOpen = computed({
    get: () => props.open,
    set: (val) => emit('update:open', val)
  })

  // Watch for edit item changes
  watch(() => props.itemToEdit, (newItem) => {
    if (newItem) {
      handleEdit(newItem)
      if (!formData.value.escalas) formData.value.escalas = []
      
      // Ensure pase_id is set correctly from the edited item
      // Directus might return an object or an ID, handle both
      if (newItem.pase_id) {
          if (typeof newItem.pase_id === 'object' && newItem.pase_id !== null) {
              formData.value.pase_id = (newItem.pase_id as any).id
          } else {
              formData.value.pase_id = newItem.pase_id
          }
      } else {
          formData.value.pase_id = null
      }

      // Calculate duration if editing a pass
      if (newItem.categoria === 'pase' && newItem.fecha_inicio && newItem.fecha_fin) {
          if (newItem.tipo_duracion === 'horas') {
            formData.value.duracion_cantidad = differenceInHours(new Date(newItem.fecha_fin), new Date(newItem.fecha_inicio))
          } else {
            formData.value.duracion_cantidad = differenceInDays(new Date(newItem.fecha_fin), new Date(newItem.fecha_inicio)) + 1
          }
      }
    } else {
    handleCreate()
  }
}, { immediate: true })

watch(isOpen, (isOpened) => {
  if (isOpened && !props.itemToEdit) {
    handleCreate()
  }
})

// Watch for changes to calculate End Date
  watch([() => formData.value.fecha_inicio, () => formData.value.duracion_cantidad, () => formData.value.tipo_duracion], () => {
    if (formData.value.categoria !== 'pase') return
    if (!formData.value.fecha_inicio) return

    const amount = Number(formData.value.duracion_cantidad || 0)
    if (amount <= 0) return

    if (formData.value.tipo_duracion === 'horas') {
      formData.value.fecha_fin = addHours(formData.value.fecha_inicio, amount)
    } else {
      const daysToAdd = Math.max(0, amount - 1)
      formData.value.fecha_fin = addDays(formData.value.fecha_inicio, daysToAdd)
    }
  })

  // Watch for pass selection to auto-set price/payment
  watch(() => formData.value.pase_id, (newVal) => {
    if (newVal && formData.value.categoria === 'trayecto') {
      formData.value.precio = 0
      formData.value.estado_pago = 'pagado'
    }
  })

  const saveTransport = () => {
    handleSave((data) => {
      // Remove UI-only field
      delete data.duracion_cantidad
      
      // Calculate derived values for logic but remove them before sending
      let derivedOrigen = ''
      let derivedDestino = ''
      
      if (data.categoria === 'trayecto' && data.escalas && data.escalas.length > 0) {
        const sorted = [...data.escalas].sort((a: any, b: any) => new Date(a.fecha_salida).getTime() - new Date(b.fecha_salida).getTime())
        
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        
        if (first && last) {
            data.fecha_inicio = first.fecha_salida
            data.fecha_fin = last.fecha_llegada
            
            derivedOrigen = first.origen
            derivedDestino = last.destino
        }
        
        // Clean up system fields from nested scales to ensure clean JSON
        data.escalas = data.escalas.map((e: any) => {
          const clean = { ...e }
          // @ts-ignore
          delete clean.user_created
          // @ts-ignore
          delete clean.user_updated
          // @ts-ignore
          delete clean.date_created
          // @ts-ignore
          delete clean.date_updated
          // @ts-ignore
          delete clean.id
          return clean
        })
      }

      // Default title if empty
      if (!data.nombre) {
        if (data.categoria === 'pase') {
            data.nombre = String(t('trip_transport_drawer.defaults.pass_name'))
        } else {
            // Use derived values or fallback to existing ones (if editing) or defaults
            // We cast to any to access the properties we are about to delete
            const start = derivedOrigen || (data as any).origen || String(t('trip_transport_drawer.defaults.origin'))
            const end = derivedDestino || (data as any).destino || String(t('trip_transport_drawer.defaults.destination'))
            data.nombre = `${start} ➝ ${end}`
        }
      }
      
      // Ensure pase_id is an ID (Directus expects ID, not object)
      if (data.pase_id && typeof data.pase_id === 'object') {
          // @ts-ignore
          data.pase_id = (data.pase_id as any).id
      }

      // Remove calculated fields that don't exist in backend
      delete (data as any).origen
      delete (data as any).destino
      delete (data as any).medio
      
      data.viaje_id = typeof props.tripId === 'string' ? parseInt(props.tripId) : props.tripId
      return data
    }, () => {
      emit('saved')
      emit('update:open', false)
    })
  }

  const isValid = computed(() => {
    // if (!formData.value.nombre) return false
    if (formData.value.categoria === 'pase') {
      return formData.value.fecha_inicio && formData.value.fecha_fin
    }
    return true
  })

  const formId = computed(() => (formData.value as any).id)
  const formAdjuntos = computed(() => (formData.value as any).adjuntos || [])

  const onFileUploaded = async () => {
    // @ts-ignore
    if (!formData.value.id) return
    
    try {
      const client = await getAuthenticatedClient()
      // @ts-ignore
      const response = await client.request(readItem('transportes', formData.value.id, {
        fields: ['adjuntos.directus_files_id.*']
      }))
      
      // Update attachments in form data
      // @ts-ignore
      if (response && response.adjuntos) {
        // @ts-ignore
        formData.value.adjuntos = response.adjuntos
      }
    } catch (e) {
      console.error('Error refreshing attachments:', e)
    }
  }

  // Escalas Logic
  const addEscala = () => {
    formData.value.escalas.push({
      fecha_salida: formData.value.fecha_inicio || new Date().toISOString(),
      fecha_llegada: formData.value.fecha_inicio || new Date().toISOString(),
      origen: '',
      destino: '',
      medio: 'tren'
    })
  }

  const removeEscala = (index: number) => {
    formData.value.escalas.splice(index, 1)
  }

  const paseIdString = computed({
    get: () => formData.value.pase_id ? String(formData.value.pase_id) : 'none',
    set: (val: string) => {
      formData.value.pase_id = val === 'none' ? null : Number(val)
    }
  })
</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl">
      <DrawerHeader class="w-full max-w-7xl mx-auto px-4">
        <DrawerTitle>{{ formData.id ? $t('trip_transport_drawer.title.edit') : $t('trip_transport_drawer.title.new') }}</DrawerTitle>
      </DrawerHeader>
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row px-4">
          <div class="w-full lg:w-2/3 space-y-4 py-4">
            <div v-if="formData.categoria === 'pase'">
              <Label>{{ $t('trip_transport_drawer.fields.title') }}</Label>
              <Input v-model="formData.nombre" :placeholder="$t('trip_transport_drawer.placeholders.title')" />
            </div>

            <div>
              <Label>{{ $t('trip_transport_drawer.fields.category') }}</Label>
              <div class="flex gap-2">
                <Select v-model="formData.categoria" class="flex-1">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pase">{{ $t('trip_transport_drawer.category.pass') }}</SelectItem>
                    <SelectItem value="trayecto">{{ $t('trip_transport_drawer.category.route') }}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select v-if="formData.categoria === 'pase'" v-model="formData.tipo_duracion" class="w-32">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dias">{{ $t('trip_transport_drawer.duration_type.days') }}</SelectItem>
                    <SelectItem value="horas">{{ $t('trip_transport_drawer.duration_type.hours') }}</SelectItem>
                  </SelectContent>
                </Select>

                <Select v-if="formData.categoria === 'trayecto'" v-model="paseIdString" class="w-full">
                   <SelectTrigger>
                      <SelectValue :placeholder="$t('trip_transport_drawer.placeholders.associate_pass')" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="none">{{ $t('trip_transport_drawer.associate.none') }}</SelectItem>
                      <SelectItem v-for="pase in availablePasses" :key="pase.id" :value="String(pase.id)">
                        {{ pase.nombre }}
                      </SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>

            <!-- PASE -->
            <template v-if="formData.categoria === 'pase'">
               <div class="grid grid-cols-2 gap-2">
                  <div>
                    <Label>{{ $t('trip_transport_drawer.fields.valid_from') }}</Label>
                    <DateTimePicker 
                      v-model="formData.fecha_inicio" 
                      :min="currentTrip?.fecha_inicio || undefined"
                      :max="currentTrip?.fecha_fin || undefined"
                    />
                  </div>
                  <div>
                    <Label>{{ $t('trip_transport_drawer.fields.duration') }}</Label>
                    <Input type="number" v-model="formData.duracion_cantidad" min="1" />
                  </div>
               </div>
               <div>
                  <Label>{{ $t('trip_transport_drawer.fields.valid_until_calculated') }}</Label>
                  <Input :model-value="formatDateTime(formData.fecha_fin)" disabled class="bg-muted" />
               </div>
            </template>

            <!-- TRAYECTO (ESCALAS) -->
            <template v-if="formData.categoria === 'trayecto'">
               <div class="space-y-3">
                  <div class="flex justify-between items-center py-2">
                     <Label class="font-bold">{{ $t('trip_transport_drawer.scales.title') }}</Label>
                     <Button size="sm" @click="addEscala"><Plus class="h-3 w-3 mr-1" /> {{ $t('trip_transport_drawer.actions.add') }}</Button>
                  </div>

                  <div v-if="formData.escalas.length === 0" class="text-sm text-center py-6 border-2 border-dashed rounded-lg bg-slate-50 text-muted-foreground">
                     <p>{{ $t('trip_transport_drawer.scales.empty.title') }}</p>
                     <Button variant="link" size="sm" @click="addEscala">{{ $t('trip_transport_drawer.scales.empty.cta') }}</Button>
                  </div>

                  <div v-for="(escala, index) in formData.escalas" :key="index" class="p-4 rounded-lg relative bg-gray-50 shadow-sm">
                     <div class="flex justify-between items-center pb-6">
                        <span class="font-bold text-sm text-slate-600 flex items-center gap-2">
                           <div class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs">{{ index + 1 }}</div>
                           {{ $t('trip_transport_drawer.scales.item_title') }}
                        </span>
                        <Button @click="removeEscala(index)" variant="destructive" size="sm">
                           <Trash2 class="h-4 w-4" />
                        </Button>
                     </div>

                     <div class="space-y-4">

                        <div>
                          <Label>{{ $t('trip_transport_drawer.fields.transport_mode') }}</Label>
                          <Select v-model="escala.medio">
                              <SelectTrigger class="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tren">{{ $t('trip_transport_drawer.transport_mode.train') }}</SelectItem>
                                <SelectItem value="metro">{{ $t('trip_transport_drawer.transport_mode.metro') }}</SelectItem>
                                <SelectItem value="bus">{{ $t('trip_transport_drawer.transport_mode.bus') }}</SelectItem>
                                <SelectItem value="barco">{{ $t('trip_transport_drawer.transport_mode.ferry') }}</SelectItem>
                                <SelectItem value="taxi">{{ $t('trip_transport_drawer.transport_mode.taxi') }}</SelectItem>
                                <SelectItem value="pie">{{ $t('trip_transport_drawer.transport_mode.walk') }}</SelectItem>
                              </SelectContent>
                          </Select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div class="gap-3 space-y-4">
                              <div>
                                <Label>{{ $t('trip_transport_drawer.fields.origin') }}</Label>
                                <Input class="h-9" v-model="escala.origen" :placeholder="$t('trip_transport_drawer.placeholders.origin')" />
                              </div>
                              <div>
                                 <Label>{{ $t('trip_transport_drawer.fields.departure') }}</Label>
                                 <DateTimePicker v-model="escala.fecha_salida" />
                              </div>
                           </div>
                           <div class="gap-3 space-y-4">
                              <div>
                                 <Label>{{ $t('trip_transport_drawer.fields.destination') }}</Label>
                                 <Input class="h-9" v-model="escala.destino" :placeholder="$t('trip_transport_drawer.placeholders.destination')" />
                              </div>
                              <div>
                                 <Label>{{ $t('trip_transport_drawer.fields.arrival') }}</Label>
                                 <DateTimePicker v-model="escala.fecha_llegada" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </template>

            <div v-if="formData.categoria === 'pase' || (formData.categoria === 'trayecto' && !formData.pase_id)" class="grid grid-cols-[2fr_1fr_1fr] gap-3 mt-2">
              <div>
                <Label>{{ $t('trip_transport_drawer.fields.total_price') }}</Label>
                <Input 
                  type="number" 
                  v-model="formData.precio" 
                  :step="formData.moneda === 'JPY' ? '1' : '0.01'" 
                />
              </div>
              <div>
                <Label>{{ $t('trip_transport_drawer.fields.currency') }}</Label>
                <CurrencySelector v-model="formData.moneda" />
              </div>
              <div>
                <Label>{{ $t('trip_transport_drawer.fields.status') }}</Label>
                <Select v-model="formData.estado_pago">
                  <SelectTrigger><SelectValue :placeholder="$t('trip_transport_drawer.placeholders.status')" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">{{ $t('trip_transport_drawer.status.pending') }}</SelectItem>
                    <SelectItem value="pagado">{{ $t('trip_transport_drawer.status.paid') }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
               <Label>{{ $t('trip_transport_drawer.fields.notes') }}</Label>
               <Textarea v-model="formData.notas" rows="3" />
            </div>

          </div>
          <div class="w-full lg:w-1/3 space-y-8">
            <div v-if="formData.id" class="pb-8 border-b border-dashed">
              <div class="flex justify-between items-center mb-2">
                <Label>{{ $t('trip_transport_drawer.fields.attachments') }}</Label>
                <FileUploader collection="transportes" :item-id="formId" @uploaded="onFileUploaded" />
              </div>
              <FileList :files="formAdjuntos" collection="transportes" @deleted="onFileUploaded" />
            </div>
            <EntityTasksWidget 
              v-if="formData.id"
              :key="String(formData.id)"
              :trip-id="Number(props.tripId)"
              entity-type="transport"
              :entity-id="String(formData.id)"
              :title="`${$t('trip_transport_drawer.tasks.title_prefix')}: ${formData.nombre || $t('trip_transport_drawer.tasks.entity_fallback')}`"
            />
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button @click="saveTransport" :disabled="!isValid">{{ $t('trip_transport_drawer.actions.save') }}</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
