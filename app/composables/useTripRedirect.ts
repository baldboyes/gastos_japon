import { parseISO, startOfDay, endOfDay } from 'date-fns'
import { useTripsNew } from './useTripsNew'
import { useRoute } from 'vue-router'
import { useCookie } from '#imports'

export const useTripRedirect = () => {
  const { fetchTrips, trips } = useTripsNew()
  const route = useRoute()
  const userLocale = useCookie<string | null>('user-locale', { default: () => null })

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
      if (!trip.start_date) return false
      
      const startDateOnly = String(trip.start_date).slice(0, 10)
      const endDateOnly = trip.end_date ? String(trip.end_date).slice(0, 10) : null
      const start = startOfDay(parseISO(startDateOnly))
      // Si no hay fecha fin, asumimos que es un viaje de un día o indefinido (usamos el mismo día para verificar)
      const end = endDateOnly ? endOfDay(parseISO(endDateOnly)) : endOfDay(start)
      
      // Check if current date is within range
      return now >= start && now <= end
    })

    const supportedLocales = ['es', 'en', 'ja'] as const
    const firstSegment = (route.path || '').split('/')[1] || ''
    const pathLocale = supportedLocales.includes(firstSegment as any) ? firstSegment : null
    const preferredLocale = pathLocale || (supportedLocales.includes((userLocale.value || '') as any) ? userLocale.value : null) || 'en'
    const localePrefix = `/${preferredLocale}`

    if (activeTrip) {
      return navigateTo(`${localePrefix}/trips/${activeTrip.id}/gastos-dia`)
    } else {
      return navigateTo(`${localePrefix}/trips`)
    }
  }

  return {
    handleSmartRedirect
  }
}
