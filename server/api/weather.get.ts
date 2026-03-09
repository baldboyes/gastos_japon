import { getQuery, createError, getCookie, setHeader } from 'h3'

const WEATHER_CACHE_SECONDS = 3 * 60 * 60

export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const city = (query.city as string | undefined)?.trim()

    const lang = (query.lang as string | undefined) || getCookie(event, 'user-locale') || 'en'
    const normalizedLang = typeof lang === 'string' ? lang : 'en'

    if (!city) {
      throw createError({
        statusCode: 400,
        statusMessage: 'City is required'
      })
    }

    const apiKey = config.openweatherApiKey

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    setHeader(
      event,
      'Cache-Control',
      `public, max-age=0, s-maxage=${WEATHER_CACHE_SECONDS}, stale-while-revalidate=${WEATHER_CACHE_SECONDS}`
    )

    try {
      const response = await $fetch('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric',
          lang: normalizedLang
        }
      })
      return response
    } catch (error: any) {
      throw createError({
        statusCode: error.response?.status || 502,
        statusMessage: error.response?.statusText || 'Failed to fetch weather data',
        data: error.data
      })
    }
  },
  {
    maxAge: WEATHER_CACHE_SECONDS,
    getKey: (event) => {
      const query = getQuery(event)
      const city = (query.city as string | undefined)?.trim().toLowerCase() || ''
      const lang = (query.lang as string | undefined) || getCookie(event, 'user-locale') || 'en'
      const normalizedLang = typeof lang === 'string' ? lang : 'en'
      return `weather:${normalizedLang}:${city}`
    }
  }
)
