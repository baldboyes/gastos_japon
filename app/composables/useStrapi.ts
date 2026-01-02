import type { UseFetchOptions } from '#app'

/**
 * Composable para consumir la API de Strapi de forma segura a través del proxy de Nuxt.
 * 
 * @example
 * const { data, error } = await useStrapi('/articles')
 */
export const useStrapi = <T>(endpoint: string, options: UseFetchOptions<T> = {}) => {
  // Asegurar que el endpoint empiece con /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // Usar el proxy interno de Nuxt
  return useFetch<T>(`/api/strapi${path}`, {
    ...options,
    // Headers adicionales si son necesarios (ej: internacionalización)
    headers: {
      ...options.headers,
    }
  })
}
