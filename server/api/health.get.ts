import { strapiClient } from '../utils/strapi'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  
  // Verificación básica de variables
  const envStatus = {
    clerkPublishableKey: !!process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !!process.env.CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: !!process.env.NUXT_CLERK_SECRET_KEY || !!process.env.CLERK_SECRET_KEY,
    strapiUrl: !!config.strapiUrl,
    strapiKey: !!config.strapiKey
  }

  let strapiConnection = 'unknown'
  let strapiError = null

  // Intentar conexión real a Strapi (ping ligero)
  try {
    // Consultar endpoint público de info o usuarios (solo para validar auth)
    // Usamos /api/users que suele existir, o /api/upload/files si users está cerrado
    // En v5, /api/users/me requiere token de usuario, pero listar requiere permisos.
    // Usaremos una consulta simple.
    await strapiClient('/api/users', { 
      query: { 'pagination[pageSize]': 1 }, // Minimizar carga
      timeout: 5000 // Timeout corto para health check
    })
    strapiConnection = 'connected'
  } catch (error: any) {
    strapiConnection = 'failed'
    strapiError = error.message
    console.error('Strapi Health Check Failed:', error)
  }

  return {
    status: strapiConnection === 'connected' ? 'ok' : 'degraded',
    time: new Date().toISOString(),
    env: envStatus,
    strapi: {
      status: strapiConnection,
      error: strapiError
    }
  }
})
