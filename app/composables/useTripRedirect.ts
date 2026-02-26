import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { useTrips } from './useTrips'

export const useTripRedirect = () => {
  const { fetchTrips, trips } = useTrips()

  /**
   * Intenta redirigir al usuario al viaje activo si existe,
   * de lo contrario redirige a la lista de viajes.
   */
  const handleSmartRedirect = async () => {
    // Asegurarse de tener los viajes cargados
    if (trips.value.length === 0) {
      await fetchTrips()
    }
    
    const now = new Date()
    const activeTrip = trips.value.find(trip => {
      if (!trip.fecha_inicio) return false
      
      const start = startOfDay(parseISO(trip.fecha_inicio))
      // Si no hay fecha fin, asumimos que es un viaje de un día o indefinido (usamos el mismo día para verificar)
      const end = trip.fecha_fin ? endOfDay(parseISO(trip.fecha_fin)) : endOfDay(start)
      
      return isWithinInterval(now, { start, end })
    })

    if (activeTrip) {
      return navigateTo(`/trips/${activeTrip.id}/gastos-dia`)
    } else {
      return navigateTo('/trips')
    }
  }

  return {
    handleSmartRedirect
  }
}
