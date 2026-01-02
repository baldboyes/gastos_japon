import { ofetch } from 'ofetch'
import type { FetchOptions } from 'ofetch'

/**
 * Cliente HTTP seguro para conectar con Strapi desde el servidor Nuxt.
 * Implementa autenticación, reintentos y timeouts.
 */
export const strapiClient = async <T>(endpoint: string, options: FetchOptions = {}) => {
  const config = useRuntimeConfig()
  
  if (!config.strapiKey || !config.strapiUrl) {
    throw createError({
      statusCode: 500,
      message: 'Strapi configuration is missing on server'
    })
  }

  // Normalizar endpoint (asegurar que empiece con /)
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // Instancia base con configuración por defecto
  const client = ofetch.create({
    baseURL: config.strapiUrl as string,
    
    // Autenticación segura
    headers: {
      Authorization: `Bearer ${config.strapiKey}`,
      'Content-Type': 'application/json',
    },

    // Configuración de resiliencia
    retry: 3,
    retryDelay: 1000, // Esperar 1s entre reintentos
    timeout: 10000,   // 10s timeout
    
    // Interceptores para manejo de errores
    async onResponseError({ response }) {
      console.error(`[Strapi Error] ${response.status} ${response.url}`, response._data)
      
      // Si es error 401/403, podría ser problema de API Key
      if (response.status === 401 || response.status === 403) {
        console.error('Strapi Authentication Failed. Check API Key.')
      }
    }
  })

  try {
    return await client<T>(path, options)
  } catch (error: any) {
    // Relanzar error como H3 Error para que Nuxt lo maneje mejor
    throw createError({
      statusCode: error.response?.status || 500,
      message: error.message || 'Error connecting to Strapi',
      data: error.data
    })
  }
}
