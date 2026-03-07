import { computed, ref } from 'vue'
import { useTripOrganization } from '~/composables/useTripOrganization'
import { useTripExpenses } from '~/composables/useTripExpenses'
import { useTripTasks } from '~/composables/useTripTasks'
import { useTrips } from '~/composables/useTrips'
import { 
  format, 
  isSameDay, 
  addDays, 
  differenceInDays, 
  parseISO, 
  startOfDay, 
  isWithinInterval, 
  differenceInCalendarDays, 
  eachDayOfInterval 
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Plane, Train, BedDouble, Ticket, Banknote, CheckSquare, Moon, MapPin } from 'lucide-vue-next'
import { formatCurrency } from '~/utils/currency'

export const useItinerary = () => {
  const { currentTrip } = useTrips()
  const { 
    alojamientos,
    vuelos,
    transportes,
    timelineItems
  } = useTripOrganization()
  
  const { expenses } = useTripExpenses()
  const { tasks } = useTripTasks()

  // Selected Date State
  const selectedDate = ref<Date>(new Date())

  // Initialize selected date from trip start
  const initSelectedDate = () => {
    if (currentTrip.value?.fecha_inicio) {
      selectedDate.value = parseISO(currentTrip.value.fecha_inicio)
    }
  }

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

  const daysWithEvents = computed(() => {
    const days = tripDays.value
    if (!days.length) return []
    
    return days.map(day => {
       const dayDate = startOfDay(day)
       
       // Accommodations
       const accs = alojamientos.value.map(a => {
          if (!a.fecha_entrada || !a.fecha_salida) return null
          const start = startOfDay(parseISO(a.fecha_entrada))
          const end = startOfDay(parseISO(a.fecha_salida))
          
          if (dayDate >= start && dayDate < end) {
             let status = 'middle'
             const duration = differenceInDays(end, start)
             if (duration === 1) status = 'single'
             else if (isSameDay(dayDate, start)) status = 'start'
             else if (isSameDay(dayDate, addDays(end, -1))) status = 'end'
             
             return { 
               id: a.id, 
               title: a.nombre, 
               status, 
               duration,
               type: 'accommodation', 
               colorClass: 'bg-slate-800 text-white', 
               icon: BedDouble 
             }
          }
          return null
       }).filter((item): item is NonNullable<typeof item> => !!item)
       
       // Passes
       const passes = transportes.value.filter(t => t.categoria === 'pase').map(t => {
          if (!t.fecha_inicio || !t.fecha_fin) return null
          const start = startOfDay(parseISO(t.fecha_inicio))
          const end = startOfDay(parseISO(t.fecha_fin))
          
          if (dayDate >= start && dayDate <= end) {
              let status = 'middle'
              // Passes are inclusive of end date, so duration is diff + 1
              const duration = differenceInDays(end, start) + 1
              
              if (isSameDay(start, end)) status = 'single'
              else if (isSameDay(dayDate, start)) status = 'start'
              else if (isSameDay(dayDate, end)) status = 'end'
              
              return { 
                id: t.id, 
                title: t.nombre, 
                status, 
                duration,
                type: 'pass', 
                colorClass: 'bg-green-600 text-white', 
                icon: Ticket 
              }
          }
          return null
       }).filter((item): item is NonNullable<typeof item> => !!item)
       
       // Flights
       const flts: any[] = []
       vuelos.value.forEach(v => {
          if (v.escalas && Array.isArray(v.escalas) && v.escalas.length > 0) {
             v.escalas.forEach((escala, index) => {
                if (escala.fecha_salida && isSameDay(startOfDay(parseISO(escala.fecha_salida)), dayDate)) {
                   flts.push({
                     id: `flight-${v.id}-leg-${index}`,
                     title: escala.aerolinea ? `${escala.aerolinea}` : 'Vuelo',
                     type: 'flight',
                     icon: Plane
                   })
                }
             })
          } else if (v.fecha_salida && isSameDay(startOfDay(parseISO(v.fecha_salida)), dayDate)) {
               flts.push({
                  id: `flight-${v.id}`,
                  title: v.aerolinea || 'Vuelo',
                  type: 'flight',
                  icon: Plane
               })
          }
       })
       
       // Destinations (Ciudades)
       const dests = (currentTrip.value?.destinos || []).map((d: any) => {
         if (!d.fecha_inicio || !d.fecha_fin) return null
         const start = startOfDay(parseISO(d.fecha_inicio))
         const end = startOfDay(parseISO(d.fecha_fin))
         
         if (dayDate >= start && dayDate <= end) {
             let status = 'middle'
             // Inclusive duration? If day 1 to day 2, duration = 1.
             // If we want 50% start to 50% end, we use differenceInDays
             const duration = differenceInDays(end, start)
             
             if (duration === 0) status = 'single'
             else if (isSameDay(dayDate, start)) status = 'start'
             else if (isSameDay(dayDate, end)) status = 'end'
             
             return { 
               id: `dest-${d.ciudad}-${start.getTime()}`, 
               title: d.ciudad, 
               status, 
               duration,
               type: 'destination', 
               colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 border', 
               icon: MapPin 
             }
         }
         return null
       }).filter((item): item is NonNullable<typeof item> => !!item)

       // Activities
      const acts = timelineItems.value.filter(item => {
         const isAct = item.type === 'activity'
         const match = isSameDay(startOfDay(item.date), dayDate)
         return isAct && match
      })
      .map(item => ({
            id: item.id,
            title: item.title,
            type: 'activity',
            colorClass: 'bg-purple-100 text-purple-700',
            icon: Ticket
        }))
       
       return {
         date: day,
         accommodations: accs,
         passes: passes,
         flights: flts,
         destinations: dests,
         activities: acts
       }
    })
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
                  title: `${escala.origen} ➝ ${escala.destino}` || 'Vuelo',
                  subtitle: escala.aerolinea,
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

          if (isCheckInDay) {
            events.push({
              id: `acc-in-${a.id}`,
              type: 'accommodation_checkin',
              date: checkIn,
              title: `Check-in: ${a.nombre}`,
              subtitle: 'Entrada al alojamiento',
              icon: BedDouble,
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
              icon: BedDouble,
              colorClass: 'bg-orange-100 text-orange-700',
              time: format(checkOut, 'HH:mm'),
              isPriority: true
            })
          }

        // Case 3: Staying (Noche en...) - Intermediate days ONLY
        const nightCount = differenceInCalendarDays(checkOutDate, checkInDate)
            
        if (nightCount > 1) {
          const stayStart = addDays(checkInDate, 1)
          const stayEnd = addDays(checkOutDate, -1)
            
          if (stayStart <= stayEnd && isWithinInterval(current, { start: stayStart, end: stayEnd })) {
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
      }
    })

    // 3. Active Passes (Pases de transporte activos)
    transportes.value.filter(t => t.categoria === 'pase').forEach(t => {
      if (t.fecha_inicio && t.fecha_fin) {
        const start = startOfDay(parseISO(t.fecha_inicio))
        const end = startOfDay(parseISO(t.fecha_fin))
        
        if (current >= start && current <= end) {
          events.unshift({
            id: `pass-active-${t.id}`,
            type: 'transport_pass_active',
            title: `Pase activo: ${t.nombre}`,
            subtitle: `Válido hasta ${format(end, 'dd MMM')}`,
            icon: Ticket,
            colorClass: 'bg-green-100 text-green-700',
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
          time: format(item.date, 'HH:mm')
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

    // 2. Transition Group (Check-in/Check-out)
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
        icon: BedDouble 
      })
    }

    // 3. Timeline Items
    finalEvents.push(...otherEvents)

    return finalEvents
  })

  return {
    selectedDate,
    initSelectedDate,
    tripDays,
    getDayLabel,
    getDayName,
    getMonthLabel,
    isSelected,
    selectDate,
    daysWithEvents,
    selectedDayDetails
  }
}
