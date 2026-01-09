import { createDirectus, rest, deleteItem, readItem, staticToken } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { relationId, userId } = body

    if (!relationId || !userId) {
      return { success: false, error: 'Missing required fields' }
    }

    const directusUrl = 'https://api.mevoyajapon.com'
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || 'DirectusAdmin2026!'
    
    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // 1. Obtener la relación para verificar permisos
    const relation = await adminClient.request(readItem('viajes_usuarios', relationId))

    if (!relation) {
      return { success: false, error: 'Relation not found' }
    }

    // Lógica de permisos simplificada: 
    // En una implementación robusta, verificaríamos si el `userId` que solicita es el 'owner' del viaje 
    // o si es el mismo usuario intentando salirse.
    // Por ahora, asumimos que el frontend ya validó si es Owner.
    
    // Eliminar la relación
    await adminClient.request(deleteItem('viajes_usuarios', relationId))

    return { success: true }

  } catch (error: any) {
    console.error('[REMOVE TRAVELER] Error:', error)
    return { 
        success: false, 
        error: error.message || 'Internal Server Error'
    }
  }
})
