<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { CalendarRange, MapPin, Clock, Plane, Train, Hotel, Ticket, Loader2, Banknote, Plus } from 'lucide-vue-next'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { formatCurrency } from '~/utils/currency'
import { groupByDate } from '~/utils/grouping'

const route = useRoute()
const tripId = route.params.id as string

const { 
  fetchOrganizationData, 
  timelineItems, loading 
} = useTripOrganization()

const { expenses, fetchExpenses, createExpense } = useTripExpenses()

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

onMounted(() => {
  fetchOrganizationData(tripId)
  fetchExpenses(tripId)
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

const formatMoney = (amount: number, currency: string) => new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount)

const timeline = computed(() => {
  const events: any[] = []

  // 1. Organization Items (normalized)
  timelineItems.value.forEach(item => {
    let icon = Ticket
    let colorClass = 'bg-gray-100 text-gray-600'
    
    switch(item.type) {
        case 'flight':
            icon = Plane
            colorClass = 'bg-blue-100 text-blue-600'
            break
        case 'accommodation':
            icon = Hotel
            colorClass = 'bg-orange-100 text-orange-600'
            break
        case 'transport':
            icon = Train
            colorClass = 'bg-green-100 text-green-600'
            break
        case 'activity':
            icon = Ticket
            colorClass = 'bg-purple-100 text-purple-600'
            break
    }
    
    events.push({
        ...item,
        icon,
        colorClass,
        time: item.date.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit', hour12: false})
    })
  })

  // 2. Expenses
  expenses.value.forEach(ex => {
      events.push({
          id: `expense-${ex.id}`,
          type: 'expense',
          date: new Date(ex.fecha),
          title: ex.concepto,
          subtitle: `${formatCurrency(ex.monto, ex.moneda || 'JPY')} • ${ex.categoria}`,
          icon: Banknote,
          colorClass: 'bg-red-50 text-red-600',
          time: new Date(ex.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit', hour12: false})
      })
  })

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
})

const groupedEvents = computed(() => groupByDate(timeline.value, 'date'))
</script>

<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <div class="flex justify-between items-center">
      <div>
          <h2 class="text-2xl font-bold tracking-tight">Itinerario</h2>
          <p class="text-muted-foreground">Tu plan de viaje día a día y gastos.</p>
      </div>
      <Button @click="isExpenseDialogOpen = true">
          <Plus class="mr-2 h-4 w-4" /> Nuevo Gasto
      </Button>
    </div>

    <div v-if="loading && timeline.length === 0" class="flex justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-slate-400" />
    </div>

    <div v-else-if="timeline.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
        <CalendarRange class="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 class="text-lg font-semibold text-slate-700">Itinerario Vacío</h3>
        <p>Añade vuelos, alojamientos o actividades para verlos aquí.</p>
    </div>

    <div v-else class="space-y-8">
        <div v-for="group in groupedEvents" :key="group.date" class="relative">
            <!-- Sticky Header Día -->
            <div class="sticky top-0 z-10 bg-gray-50/95 backdrop-blur py-2 mb-4 border-b border-slate-200">
                <h3 class="text-lg font-bold capitalize text-slate-800 flex items-center">
                    <CalendarRange class="w-5 h-5 mr-2 text-primary" />
                    {{ group.date }}
                </h3>
            </div>

            <!-- Timeline Items -->
            <div class="space-y-4 pl-4 border-l-2 border-slate-200 ml-2.5">
                <div v-for="event in group.items" :key="event.id" class="relative pl-6 group">
                    <!-- Dot -->
                    <div class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center" :class="event.colorClass">
                         <div class="w-2 h-2 rounded-full bg-current"></div>
                    </div>

                    <Card class="hover:shadow-md transition-shadow duration-200 border-l-4" :class="event.type === 'flight' ? 'border-l-blue-400' : event.type === 'accommodation' || event.type === 'hotel' ? 'border-l-orange-400' : event.type === 'activity' ? 'border-l-purple-400' : event.type === 'expense' ? 'border-l-red-400' : 'border-l-green-400'">
                        <CardContent class="p-4 flex items-start gap-4">
                            <div class="p-2 rounded-lg shrink-0" :class="event.colorClass.replace('text-', 'bg-opacity-20 text-')">
                                <component :is="event.icon" class="w-5 h-5" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start">
                                    <h4 class="font-semibold text-slate-900 truncate pr-2">{{ event.title }}</h4>
                                    <Badge variant="outline" class="font-mono text-xs">{{ event.time }}</Badge>
                                </div>
                                <p v-if="event.subtitle" class="text-sm text-slate-500 mt-0.5 truncate">{{ event.subtitle }}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>

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
            <div><Label>Notas</Label><Textarea v-model="expenseForm.descripcion" /></div>
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
  </div>
</template>
