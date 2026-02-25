<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { useTripTasks } from '~/composables/useTripTasks'
import { useItinerary } from '~/composables/useItinerary'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const tripId = route.params.id as string

const { fetchOrganizationData } = useTripOrganization()
const { fetchExpenses, createExpense } = useTripExpenses()
const { fetchTasks } = useTripTasks()

const { 
  selectedDate, 
  initSelectedDate, 
  daysWithEvents, 
  selectedDayDetails,
  selectDate
} = useItinerary()

// Expense State
const isExpenseDialogOpen = ref(false)
const expenseForm = ref({
  fecha: new Date().toISOString().slice(0, 16),
  concepto: '',
  monto: 0,
  categoria: 'food',
  descripcion: '',
  metodo_pago: 'cash',
  es_compartido: false,
  moneda: 'JPY'
})

onMounted(async () => {
  await fetchOrganizationData(tripId)
  await fetchExpenses(tripId)
  await fetchTasks(parseInt(tripId))
  initSelectedDate()
})

const handleCreateExpense = async () => {
  if (!expenseForm.value.concepto || !expenseForm.value.monto) return
  try {
    await createExpense({
      ...expenseForm.value,
      viaje_id: parseInt(tripId),
      fecha: new Date(expenseForm.value.fecha).toISOString()
    })
    isExpenseDialogOpen.value = false
    expenseForm.value = {
      fecha: new Date().toISOString().slice(0, 16),
      concepto: '',
      monto: 0,
      categoria: 'food',
      descripcion: '',
      metodo_pago: 'cash',
      es_compartido: false,
      moneda: 'JPY'
    }
  } catch(e) { console.error(e) }
}
</script>

<template>
  <ItineraryDaysSwiper 
    :days="daysWithEvents" 
    :selectedDate="selectedDate" 
    @select="selectDate"
  />
  <ItineraryDayList 
    :events="selectedDayDetails" 
    :date="selectedDate"
    :tripId="tripId"
    @create-expense="isExpenseDialogOpen = true"
  />
  <!-- Modal Nuevo Gasto -->
  <Dialog v-model:open="isExpenseDialogOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
          <DialogTitle>Nuevo Gasto Diario</DialogTitle>
          <DialogDescription>Registra un gasto menor (comida, metro, etc).</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
            <Label>Fecha</Label><Input type="datetime-local" v-model="expenseForm.fecha" />
            </div>
            <div class="grid gap-2">
            <Label>Monto</Label><Input type="number" v-model="expenseForm.monto" />
            </div>
        </div>
        <div><Label>Concepto</Label><Input v-model="expenseForm.concepto" /></div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <Label>Categoría</Label>
                <Select v-model="expenseForm.categoria">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="food">Comida</SelectItem>
                        <SelectItem value="transport">Transporte</SelectItem>
                        <SelectItem value="accommodation">Alojamiento</SelectItem>
                        <SelectItem value="shopping">Compras</SelectItem>
                        <SelectItem value="entertainment">Ocio</SelectItem>
                        <SelectItem value="other">Otros</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
            <Label>Método Pago</Label>
            <Select v-model="expenseForm.metodo_pago">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="ic">Tarjeta IC</SelectItem>
                </SelectContent>
            </Select>
            </div>
        </div>
        <div>
          <Label>Notas</Label>
          <Textarea v-model="expenseForm.descripcion" />
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox :checked="expenseForm.es_compartido" @update:checked="expenseForm.es_compartido = $event" />
          <Label>Gasto compartido</Label>
        </div>
      </div>
      <DialogFooter>
          <Button @click="handleCreateExpense">Guardar Gasto</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
