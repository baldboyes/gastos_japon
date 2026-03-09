import { useWeather } from './useWeather'
import { startOfDay, parseISO } from 'date-fns'
import type { Trip } from '~/types/directus'

export const useTripWeather = () => {
  const { weather, loading, error, fetchWeather: fetchWeatherApi } = useWeather()

  const getCityForDate = (trip: Trip, date: Date = new Date()) => {
    if (!trip?.destinations || !Array.isArray(trip.destinations)) return null

    const targetDate = startOfDay(date)
    
    // Convert destinations to unified format if needed
    // Assuming destinations structure from search result: { city, start_date, end_date }
    const destination = trip.destinations.find((d: any) => {
      // Handle both naming conventions if present (start_date/fecha_inicio)
      const startDateStr = d.start_date || d.fecha_inicio
      const endDateStr = d.end_date || d.fecha_fin
      
      if (!startDateStr || !endDateStr) return false
      
      const start = startOfDay(parseISO(startDateStr))
      const end = startOfDay(parseISO(endDateStr))
      
      // Check if target date is within range [start, end]
      return targetDate >= start && targetDate <= end
    })

    return destination?.city || null
  }

  const loadWeatherForTrip = async (trip: Trip) => {
    const city = getCityForDate(trip)
    if (city) {
      await fetchWeatherApi(city)
    }
  }

  return {
    weather,
    loading,
    error,
    loadWeatherForTrip,
    getCityForDate
  }
}
