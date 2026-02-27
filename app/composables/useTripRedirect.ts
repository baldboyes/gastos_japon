import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import { useTrips } from './useTrips'
import { useRoute } from 'vue-router'
import { useCookie } from '#imports'

export const useTripRedirect = () => {
  const { fetchTrips, trips } = useTrips()
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
      if (!trip.fecha_inicio) return false
      
      const start = startOfDay(parseISO(trip.fecha_inicio))
      // Si no hay fecha fin, asumimos que es un viaje de un día o indefinido (usamos el mismo día para verificar)
      const end = trip.fecha_fin ? endOfDay(parseISO(trip.fecha_fin)) : endOfDay(start)
      
      return isWithinInterval(now, { start, end })
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
