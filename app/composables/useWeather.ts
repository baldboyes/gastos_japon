import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { AsyncData } from '#app'

interface WeatherData {
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  wind: {
    speed: number
    deg: number
  }
  name: string
  cod: number
}

const WEATHER_CACHE_PREFIX = 'weather_cache_v1'
const WEATHER_CACHE_DURATION = 3 * 60 * 60 * 1000

export const useWeather = () => {
  const weather = ref<WeatherData | null>(null)
  const loading = ref(false)
  const error = ref<any>(null)

  const route = useRoute()
  const currentLocale = computed(() => {
    const path = route?.path || ''
    const pathLocale = path.split('/')[1]
    return ['es', 'en', 'ja'].includes(pathLocale) ? pathLocale : 'es'
  })

  const fetchWeather = async (city: string) => {
    loading.value = true
    error.value = null

    const lang = currentLocale.value
    const normalizedCity = (city || '').trim().toLowerCase()
    const cacheKey = `${WEATHER_CACHE_PREFIX}:${lang}:${normalizedCity}`
    const now = Date.now()

    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { timestamp: number; data: WeatherData }
          if (parsed?.timestamp && parsed?.data && now - parsed.timestamp < WEATHER_CACHE_DURATION) {
            weather.value = parsed.data
            loading.value = false
            return
          }
        } catch {
          localStorage.removeItem(cacheKey)
        }
      }
    }

    try {
      const { data, error: apiError } = await useFetch<WeatherData>('/api/weather', {
        query: { 
          city,
          lang
        }
      })
      
      if (apiError.value) {
        throw apiError.value
      }
      
      weather.value = data.value

      if (weather.value && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: now,
            data: weather.value
          })
        )
      }
    } catch (e) {
      console.error('Error fetching weather:', e)
      error.value = e

      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { timestamp: number; data: WeatherData }
            if (parsed?.data) {
              weather.value = parsed.data
            }
          } catch {}
        }
      }
    } finally {
      loading.value = false
    }
  }

  return {
    weather,
    loading,
    error,
    fetchWeather
  }
}
