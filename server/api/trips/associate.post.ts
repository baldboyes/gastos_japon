import { createDirectus, rest, createItem, staticToken } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { tripId, userId } = body

    if (!tripId || !userId) {
      return { success: false, error: 'Missing tripId or userId' }
    }

    const directusUrl = 'https://api.mevoyajapon.com'
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || 'DirectusAdmin2026!'
    
    // Conectar como Admin
    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // Crear asociación
    const result = await adminClient.request(createItem('viajes_usuarios', {
        viaje_id: tripId,
        directus_user_id: userId,
        rol: 'owner',
        status: 'published'
    }))

    return { success: true, id: result.id }

  } catch (error: any) {
    console.error('[ASSOC] Error:', error.message)
    return { 
        success: false, 
        error: error.message, 
        code: error.code,
        errors: error.errors
    }
  }
})
