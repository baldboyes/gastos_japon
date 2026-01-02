import { strapiClient } from '~/server/utils/strapi'

export default defineEventHandler(async (event) => {
  // Obtener ruta relativa después de /api/strapi/
  // Ejemplo: /api/strapi/articles -> /api/articles (Strapi usa prefijo /api por defecto)
  const path = event.path.replace(/^\/api\/strapi/, '/api')
  
  const method = event.method
  const body = method !== 'GET' ? await readBody(event).catch(() => undefined) : undefined
  const query = getQuery(event)

  try {
    const response = await strapiClient(path, {
      method,
      body,
      query
    })
    
    return response
  } catch (error: any) {
    // Propagar el error original de Strapi
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Strapi Proxy Error',
      data: error.data
    })
  }
})
