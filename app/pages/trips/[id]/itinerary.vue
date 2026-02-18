<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { useTripTasks } from '~/composables/useTripTasks'
import { useTrips } from '~/composables/useTrips'
import { CalendarRange, MapPin, Clock, Plane, Train, Hotel, Ticket, Loader2, Banknote, Plus, CheckSquare, Cloud, Sun, CloudRain, Moon } from 'lucide-vue-next'
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
import { eachDayOfInterval, format, isSameDay, addDays, differenceInDays, parseISO, startOfDay, endOfDay, isWithinInterval, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'

const route = useRoute()
const tripId = route.params.id as string

const { currentTrip } = useTrips()
const { 
  fetchOrganizationData, 
  timelineItems, loading,
  alojamientos,
  vuelos,
  transportes
} = useTripOrganization()

const { expenses, fetchExpenses, createExpense } = useTripExpenses()
const { tasks, fetchTasks } = useTripTasks()

// Selected Date State
const selectedDate = ref<Date>(new Date())

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
  
  // Set initial selected date to trip start if available
  if (currentTrip.value?.fecha_inicio) {
    selectedDate.value = parseISO(currentTrip.value.fecha_inicio)
  }
})

// --- Timeline Header Logic ---

const tripDays = computed(() => {
  if (!currentTrip.value?.fecha_inicio) return []
  
  const start = parseISO(currentTrip.value.fecha_inicio)
  const end = currentTrip.value.fecha_fin ? parseISO(currentTrip.value.fecha_fin) : addDays(start, 14)
  
  return eachDayOfInterval({ start, end })
})

const getDayLabel = (date: Date) => format(date, 'd', { locale: es })
const getDayName = (date: Date) => format(date, 'EEEE', { locale: es })
const getMonthLabel = (date: Date) => format(date, 'MMM', { locale: es })

const isSelected = (date: Date) => isSameDay(date, selectedDate.value)

const selectDate = (date: Date) => {
  selectedDate.value = date
}

// Multi-day items calculation
const multiDayItems = computed(() => {
  const items: any[] = []
  if (!tripDays.value.length) return items

  const tripStart = startOfDay(tripDays.value[0])

  // 1. Accommodations
  alojamientos.value.forEach(a => {
    if (a.fecha_entrada && a.fecha_salida) {
      const start = startOfDay(parseISO(a.fecha_entrada))
      const end = startOfDay(parseISO(a.fecha_salida))
      
      const rawStartIndex = differenceInDays(start, tripStart)
      const rawDuration = differenceInDays(end, start)
      
      let startIndex = rawStartIndex
      let duration = rawDuration

      // Adjust for items starting before the trip view
      if (startIndex < 0) {
        duration += startIndex // reduce duration by the days missed
        startIndex = 0
      }
      
      if (duration > 0) {
        items.push({
          id: `acc-${a.id}`,
          type: 'accommodation',
          title: a.nombre,
          startIndex,
          duration, // span columns
          colorClass: 'bg-slate-800 text-white',
          icon: Hotel
        })
      }
    }
  })

  // 2. Transport Passes
  transportes.value.filter(t => t.categoria === 'pase').forEach(t => {
    if (t.fecha_inicio && t.fecha_fin) {
      const start = startOfDay(parseISO(t.fecha_inicio))
      const end = startOfDay(parseISO(t.fecha_fin))
      
      const rawStartIndex = differenceInDays(start, tripStart)
      const rawDuration = differenceInDays(end, start) + 1 // Inclusive for passes
      
      let startIndex = rawStartIndex
      let duration = rawDuration

      if (startIndex < 0) {
        duration += startIndex
        startIndex = 0
      }
      
      if (duration > 0) {
        items.push({
          id: `pass-${t.id}`,
          type: 'pass',
          title: t.nombre,
          startIndex,
          duration,
          colorClass: 'bg-green-600 text-white',
          icon: Ticket
        })
      }
    }
  })

  // 3. Flights (Multi-day or overlay)
  // Flights are usually point-in-time but if we want to show them on the bar:
  vuelos.value.forEach(v => {
      // Prioritize segments (escalas) if available to show all legs including return flights
      if (v.escalas && Array.isArray(v.escalas) && v.escalas.length > 0) {
        v.escalas.forEach((escala, index) => {
          if (escala.fecha_salida) {
             const start = startOfDay(parseISO(escala.fecha_salida))
             const startIndex = differenceInDays(start, tripStart)
             
             if (startIndex >= 0 && startIndex < tripDays.value.length) {
                items.push({
                   id: `flight-${v.id}-leg-${index}`,
                   type: 'flight',
                   title: escala.aerolinea 
                     ? `${escala.aerolinea} (${escala.origen} ➝ ${escala.destino})`
                     : `${escala.origen} ➝ ${escala.destino}`,
                   startIndex,
                   duration: 1,
                   colorClass: 'bg-transparent text-slate-900',
                   icon: Plane
                })
             }
          }
        })
      } 
      // Fallback for flights without segments (legacy or simple records)
      else if (v.fecha_salida) {
          const start = startOfDay(parseISO(v.fecha_salida))
          const startIndex = differenceInDays(start, tripStart)
          // Simple 1 day block for flight departure
          if (startIndex >= 0 && startIndex < tripDays.value.length) {
             items.push({
                id: `flight-${v.id}`,
                type: 'flight',
                title: v.aerolinea || 'Vuelo',
                startIndex,
                duration: 1,
                colorClass: 'bg-transparent text-slate-900', // Icon only mostly
                icon: Plane
             })
          }
      }
  })

  return items
})

// --- Detail View Logic ---

const selectedDayDetails = computed(() => {
  const current = selectedDate.value
  const events: any[] = []

  // 1. Organization Items (Activities, Transports (Trayectos))
  // Manually handle flights to support segments (escalas)
  vuelos.value.forEach(v => {
    if (v.escalas && Array.isArray(v.escalas) && v.escalas.length > 0) {
      v.escalas.forEach((escala, index) => {
         if (escala.fecha_salida) {
            const start = parseISO(escala.fecha_salida)
            
            if (isSameDay(start, current)) {
                let timeStr = format(start, 'HH:mm')
                let dayDiff = 0
                
                if (escala.fecha_llegada) {
                  const end = parseISO(escala.fecha_llegada)
                  timeStr += ` - ${format(end, 'HH:mm')}`
                  dayDiff = differenceInCalendarDays(end, start)
                }
                
                events.push({
                  id: `flight-${v.id}-leg-${index}`,
                  type: 'flight',
                  title: escala.aerolinea || 'Vuelo',
                  subtitle: `${escala.origen} ➝ ${escala.destino}`,
                  icon: Plane,
                  colorClass: 'bg-blue-100 text-blue-600',
                  time: timeStr,
                  dayDiff: dayDiff > 0 ? `+${dayDiff}` : null
                })
            }
         }
      })
    } else if (v.fecha_salida) {
      const start = parseISO(v.fecha_salida)
      
      if (isSameDay(start, current)) {
          let timeStr = format(start, 'HH:mm')
          let dayDiff = 0

          if (v.fecha_llegada) {
            const end = parseISO(v.fecha_llegada)
            timeStr += ` - ${format(end, 'HH:mm')}`
            dayDiff = differenceInCalendarDays(end, start)
          }

          events.push({
            id: `flight-${v.id}`,
            type: 'flight',
            title: v.aerolinea || 'Vuelo',
            subtitle: `${v.origen || '?'} ➝ ${v.destino || '?'}`, 
            icon: Plane,
            colorClass: 'bg-blue-100 text-blue-600',
            time: timeStr,
            dayDiff: dayDiff > 0 ? `+${dayDiff}` : null
          })
      }
    }
  })

  // 2. Accommodations (Check-in, Check-out, and Stay)
  alojamientos.value.forEach(a => {
      if (a.fecha_entrada && a.fecha_salida) {
          const checkIn = parseISO(a.fecha_entrada)
          const checkOut = parseISO(a.fecha_salida)
          
          const checkInDate = startOfDay(checkIn)
          const checkOutDate = startOfDay(checkOut)

          // Check if this day is a Check-in or Check-out day
          const isCheckInDay = isSameDay(checkInDate, current)
          const isCheckOutDay = isSameDay(checkOutDate, current)

          // Case 1: Transition Day (Check-out from one + Check-in to another, or same hotel)
          // Actually, we are iterating PER HOTEL.
          // If this specific hotel has check-in today:
          if (isCheckInDay) {
             // Does this hotel ALSO have check-out today? (Day use?) - Unlikely but possible
             // Or more likely: We want to show "Check-in"
             // But user says: "si existe salida y entrada cada una tiene que ocupar el 50% y estar juntas"
             // This implies VISUAL grouping if multiple events happen.
             // But for a SINGLE hotel, usually you only Check-in OR Check-out on a given day.
             // UNLESS it's a "day use" (same day in/out).
             
             // However, the user might mean: "On a day where I leave Hotel A and enter Hotel B".
             // Since we iterate hotels individually, we create separate events.
             // We need to handle the "50% width" in the TEMPLATE rendering, grouping by type?
             // OR we create a "Combined" event? No, they are different hotels.
             
             // Let's create the event normally, but with a flag 'isHalfWidth' if we detect another hotel event?
             // That's hard inside this loop.
             // Better: Let the rendering logic handle the "flex row" if multiple priority events exist.
             
             // For "Stay" card: "si solo existe entrada o salida al alojamiento no hace falta poner la tarjeta de hacer noche"
             // This means: Don't show "Noche en X" on the Check-in day or Check-out day?
             // Or does it mean: If I only check-in (and stay), do I show "Noche en"?
             // "si solo existe entrada o salida... no hace falta poner la tarjeta de hacer noche"
             // -> On Check-in day: I have "Entrada". Do I need "Noche en"? 
             //    User says NO.
             // -> On Check-out day: I have "Salida". Do I need "Noche en"? 
             //    User says NO. (Logic already excluded check-out day)
             // -> So "Noche en" only on PURE stay days (intermediate days).
             
             events.push({
               id: `acc-in-${a.id}`,
               type: 'accommodation_checkin',
               date: checkIn,
               title: `Check-in: ${a.nombre}`,
               subtitle: 'Entrada al alojamiento',
               icon: Hotel,
               colorClass: 'bg-indigo-100 text-indigo-700',
               time: format(checkIn, 'HH:mm'),
               isPriority: true
             })
          }

          if (isCheckOutDay) {
             events.push({
               id: `acc-out-${a.id}`,
               type: 'accommodation_checkout',
               date: checkOut,
               title: `Check-out: ${a.nombre}`,
               subtitle: 'Salida del alojamiento',
               icon: Hotel,
               colorClass: 'bg-orange-100 text-orange-700',
               time: format(checkOut, 'HH:mm'),
               isPriority: true
             })
          }

          // Case 3: Staying (Noche en...) - Intermediate days ONLY
          // Exclude Check-in day AND Check-out day
          // Interval: (CheckIn, CheckOut) -> Open start, Open end
          if (isWithinInterval(current, { start: addDays(checkInDate, 1), end: addDays(checkOutDate, -1) })) {
             events.unshift({
               id: `acc-stay-${a.id}`,
               type: 'accommodation_stay',
               date: startOfDay(current),
               title: `Noche en ${a.nombre}`,
               subtitle: a.ubicacion?.city || 'Alojamiento',
               icon: Moon,
               colorClass: 'bg-slate-800 text-white',
               time: '',
               isSticky: true
             })
          }
      }
  })

  timelineItems.value.forEach(item => {
    if (isSameDay(item.date, current)) {
       if (item.type === 'flight' || item.type === 'accommodation') return // handled separately

       let icon = Ticket
       let colorClass = 'bg-gray-100 text-gray-600'
       
       switch(item.type) {
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
    }
  })

  // 2. Tasks
  tasks.value.forEach(task => {
      if (task.due_date && isSameDay(parseISO(task.due_date), current)) {
          events.push({
              id: `task-${task.id}`,
              type: 'task',
              date: parseISO(task.due_date),
              title: task.title,
              subtitle: 'Tarea',
              icon: CheckSquare,
              colorClass: 'bg-yellow-100 text-yellow-600',
              time: parseISO(task.due_date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit', hour12: false})
          })
      }
  })

  // 3. Expenses
  expenses.value.forEach(ex => {
      if (isSameDay(new Date(ex.fecha), current)) {
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
      }
  })

  // Post-process: Separate Accommodation events to enforce layout requirements
  const stayEvents = events.filter(e => e.type === 'accommodation_stay')
  const transitionEvents = events.filter(e => e.type === 'accommodation_checkin' || e.type === 'accommodation_checkout')
  const otherEvents = events.filter(e => !e.type.startsWith('accommodation_'))

  // Sort Transition Events: Checkout (morning) -> Checkin (afternoon)
  transitionEvents.sort((a, b) => {
      if (a.type === 'accommodation_checkout' && b.type === 'accommodation_checkin') return -1
      if (a.type === 'accommodation_checkin' && b.type === 'accommodation_checkout') return 1
      return 0
  })

  // Sort Other Events by Time
  otherEvents.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateA - dateB
  })

  const finalEvents = []

  // 1. Stay (Always Top)
  finalEvents.push(...stayEvents)

  // 2. Transition Group (Check-in/Check-out) - Grouped for side-by-side layout
  if (transitionEvents.length > 0) {
      finalEvents.push({
          id: `acc-group-${current.getTime()}`,
          type: 'accommodation_transition_group',
          items: transitionEvents,
          date: transitionEvents[0].date,
          colorClass: 'bg-slate-100 text-slate-500',
          time: '',
          title: 'Alojamiento',
          subtitle: '',
          icon: Hotel 
      })
  }

  // 3. Timeline Items
  finalEvents.push(...otherEvents)

  return finalEvents
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
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Header Fijo: Timeline Scroll -->
    <div class="shrink-0">
      <div class="w-full overflow-x-auto custom-scrollbar">
        <div class="relative p-4 min-w-max">
          <!-- Days Grid -->
          <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${tripDays.length}, 9rem)` }">
              <div 
                v-for="(day, index) in tripDays" 
                :key="day.toISOString()" 
                class="bg-white rounded-2xl flex flex-col justify-start p-4 cursor-pointer transition-all relative w-36 h-32"
                :class="isSelected(day) ? 'scale-104 bg-white shadow-lg' : 'hover:shadow-sm'"
                @click="selectDate(day)"
              >
                <div class="flex flex-col items-start gap-0">
                  <div class="flex items-baseline gap-0.75">
                    <span class="text-2xl font-bold uppercase text-muted-foreground" :class="isSelected(day) ? 'text-orange-600' : 'text-slate-700'">{{ getDayLabel(day) }}</span>
                    <span>{{ getMonthLabel(day) }}</span>
                  </div>
                  <span class="-mt-2 text-lg">{{ getDayName(day) }}</span>
                </div>
                
                <!-- Weather Mock (Static for now, implies connection to weather API) -->
                <div class="absolute top-3 right-3">
                    <Sun class="h-4 w-4 text-orange-400" v-if="index % 3 === 0" />
                    <Cloud class="h-4 w-4 text-slate-400" v-else-if="index % 3 === 1" />
                    <CloudRain class="h-4 w-4 text-blue-400" v-else />
                </div>
              </div>
          </div>

          <!-- Accommodations (Row 2) -->
          <div class="absolute top-[90px] left-8 w-full h-5 grid pointer-events-none gap-2 px-4" :style="{ gridTemplateColumns: `repeat(${tripDays.length}, 9rem)` }">
            <div 
              v-for="item in multiDayItems.filter(i => i.type === 'accommodation')" 
              :key="item.id"
              class="relative mx-0 rounded-sm text-xs font-medium flex items-center px-2 truncate shadow-sm z-20"
              :class="item.colorClass"
              :style="{ 
                  gridColumnStart: item.startIndex + 1, 
                  gridColumnEnd: `span ${item.duration}` 
              }"
            >
              <component :is="item.icon" class="h-3 w-3 mr-2 shrink-0 -mt-0.5" />
              <span class="truncate">{{ item.title }}</span>
            </div>
          </div>

          <!-- Passes (Row 3) -->
          <div class="absolute top-[115px] left-0 w-full h-5 grid pointer-events-none gap-2 px-4" :style="{ gridTemplateColumns: `repeat(${tripDays.length}, 9rem)` }">
              <div 
                v-for="item in multiDayItems.filter(i => i.type === 'pass')" 
                :key="item.id"
                class="relative mx-2 rounded-sm text-xs font-bold flex items-center px-2 truncate shadow-sm z-20"
                :class="item.colorClass"
                :style="{ 
                    gridColumnStart: item.startIndex + 1, 
                    gridColumnEnd: `span ${item.duration}` 
                }"
              >
                <component :is="item.icon" class="h-3 w-3 mr-2 shrink-0 -mt-0.5" />
                <span class="truncate">{{ item.title }}</span>
              </div>
          </div>

          <!-- Flights (Row 1) -->
          <div class="absolute top-14 left-0 w-full h-5 grid pointer-events-none gap-2 px-4" :style="{ gridTemplateColumns: `repeat(${tripDays.length}, 9rem)` }">
            <div 
              v-for="item in multiDayItems.filter(i => i.type === 'flight')" 
              :key="item.id"
              class="flex justify-end items-center z-20 mr-3"
              :style="{ 
                gridColumnStart: item.startIndex + 1, 
                gridColumnEnd: 'span 1' 
              }"
            >
              <Plane class="h-4 w-4 text-blue-600/80" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold flex items-center gap-2">
              {{ getDayName(selectedDate) }}, {{ getDayLabel(selectedDate) }} de {{ getMonthLabel(selectedDate) }}
            </h2>
          </div>
          <Button @click="isExpenseDialogOpen = true">
              <Plus class="mr-2 h-4 w-4" /> Nuevo Gasto
          </Button>
        </div>

        <div v-if="selectedDayDetails.length === 0" class="text-center py-12 border rounded-lg bg-white border-dashed text-muted-foreground">
            <Clock class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">Sin planes para este día</h3>
            <p>No hay actividades, trayectos ni tareas programadas.</p>
        </div>

        <div v-else class="space-y-4">
            <div v-for="event in selectedDayDetails" :key="event.id" class="relative pl-6 group">
                  <!-- Dot -->
                  <div class="absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-white z-10 ring-4 ring-slate-50">
                      <div class="w-2 h-2 rounded-full" :class="event.colorClass.split(' ')[1].replace('text-', 'bg-')"></div>
                  </div>
                  <!-- Line -->
                  <div class="absolute left-[7px] top-8 bottom-[-16px] w-0.5 bg-slate-200 group-last:hidden"></div>

                  <!-- Special "Noche en" sticky header-like card -->
                  <div 
                    v-if="event.type === 'accommodation_stay'" 
                    class="mb-3 rounded-lg bg-slate-800 p-3 text-white shadow-md flex items-center gap-3"
                  >
                      <div class="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                          <component :is="event.icon" class="h-4 w-4 text-slate-200" />
                      </div>
                      <div class="min-w-0">
                          <h4 class="font-semibold text-sm">{{ event.title }}</h4>
                          <p v-if="event.subtitle" class="text-xs text-slate-400 mt-0 truncate">{{ event.subtitle }}</p>
                      </div>
                  </div>

                  <!-- Priority Group Row (Check-in/Out) -->
                  <div v-else-if="event.type === 'accommodation_transition_group'" class="flex flex-wrap -mx-1 mb-2">
                      <div 
                        v-for="subEvent in event.items" 
                        :key="subEvent.id"
                        class="px-1"
                        :class="event.items.length > 1 ? 'w-1/2' : 'w-full'"
                      >
                         <div 
                           class="w-full h-full rounded-lg border p-2 flex flex-col justify-between transition-colors shadow-sm min-h-[80px]"
                           :class="subEvent.type === 'accommodation_checkin' 
                              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'"
                         >
                              <div class="flex justify-between items-start w-full mb-1">
                                   <div 
                                     class="h-8 w-8 rounded-full flex items-center justify-center shrink-0" 
                                     :class="subEvent.type === 'accommodation_checkin' 
                                        ? 'bg-slate-700 text-slate-200' 
                                        : subEvent.colorClass"
                                   >
                                       <component :is="subEvent.icon" class="h-4 w-4" />
                                   </div>
                                   <Badge 
                                     variant="outline" 
                                     class="font-mono text-[10px] px-1 h-5"
                                     :class="subEvent.type === 'accommodation_checkin' ? 'text-slate-300 border-slate-600' : ''"
                                   >
                                     {{ subEvent.time }}
                                   </Badge>
                              </div>
                              <div class="min-w-0">
                                  <h4 
                                    class="font-semibold truncate text-xs" 
                                    :class="subEvent.type === 'accommodation_checkin' ? 'text-white' : 'text-slate-900'"
                                    :title="subEvent.title"
                                  >
                                    {{ subEvent.title.replace('Check-in: ', '').replace('Check-out: ', '') }}
                                  </h4>
                                  <p 
                                    class="text-[10px] mt-0 truncate uppercase font-bold tracking-wider"
                                    :class="subEvent.type === 'accommodation_checkin' ? 'text-slate-400' : 'text-slate-500'"
                                  >
                                    {{ subEvent.type === 'accommodation_checkin' ? 'Check-in' : 'Check-out' }}
                                  </p>
                              </div>
                         </div>
                      </div>
                  </div>

                  <!-- Standard Event Card -->
                  <Card v-else class="mb-3 hover:shadow-md transition-shadow duration-200 border-l-4 overflow-hidden" 
                    :class="event.type === 'flight' ? 'border-l-blue-400' : event.type === 'accommodation' || event.type === 'hotel' ? 'border-l-orange-400' : event.type === 'activity' ? 'border-l-purple-400' : event.type === 'expense' ? 'border-l-red-400' : event.type === 'task' ? 'border-l-yellow-400' : 'border-l-green-400'">
                    <CardContent class="p-4 flex items-start gap-4">
                        <div class="p-2 rounded-lg shrink-0 bg-opacity-10" :class="event.colorClass.replace('text-', 'bg-')">
                            <component :is="event.icon" class="w-5 h-5" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <h4 class="font-semibold text-slate-900 truncate pr-2">{{ event.title }}</h4>
                                <Badge variant="outline" class="font-mono text-xs">
                                    {{ event.time }}
                                    <sup v-if="event.dayDiff" class="text-red-500 font-bold ml-0.5">{{ event.dayDiff }}</sup>
                                </Badge>
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

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
