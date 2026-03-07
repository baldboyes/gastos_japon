import { createDirectus, rest, createItem, staticToken } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { tripId, userId } = body

    if (!tripId || !userId) {
      return { success: false, error: 'Missing tripId or userId' }
    }

    const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN

    if (!adminToken) {
      return { success: false, error: 'Missing DIRECTUS_ADMIN_TOKEN' }
    }
    
    // Conectar como Admin
    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // Crear asociación
    const result = await adminClient.request(createItem('trips_users', {
        trip_id: tripId,
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
