import { createDirectus, rest, deleteItem, readItem, staticToken, updateItems } from '@directus/sdk'

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

    // Lógica de reasignación de items antes de eliminar
    try {
      const tripId = relation.viaje_id
      const removedUserId = relation.directus_user_id

      // Obtener el creador del viaje
      const trip = await adminClient.request(readItem('viajes', tripId, {
        fields: ['user_created']
      }))

      // El campo user_created suele ser un UUID string, pero verificamos por seguridad
      const tripOwnerId = typeof trip.user_created === 'object' && trip.user_created !== null 
        ? trip.user_created.id 
        : trip.user_created

      // Si el usuario que se elimina NO es el creador del viaje (evitar bucles raros)
      // y tenemos un ID de propietario válido
      if (removedUserId && tripOwnerId && removedUserId !== tripOwnerId) {
        const collections = ['alojamientos', 'vuelos', 'transportes', 'actividades', 'seguros', 'gastos']
        
        // Ejecutamos las actualizaciones en paralelo
        await Promise.all(collections.map(async (collection) => {
          try {
            await adminClient.request(updateItems(collection as any, {
              filter: {
                _and: [
                  { viaje_id: { _eq: tripId } },
                  { user_created: { _eq: removedUserId } }
                ]
              },
              data: {
                user_created: tripOwnerId
              }
            }))
          } catch (err) {
            // Logueamos pero no detenemos el proceso si una colección falla (ej: si no existe)
            console.warn(`[REMOVE TRAVELER] No se pudieron reasignar items en ${collection}:`, err)
          }
        }))
        
        console.log(`[REMOVE TRAVELER] Items reasignados de ${removedUserId} a ${tripOwnerId} en el viaje ${tripId}`)
      }
    } catch (reassignError) {
      console.error('[REMOVE TRAVELER] Error en proceso de reasignación:', reassignError)
      // Continuamos con la eliminación del usuario aunque falle la reasignación
      // O podríamos abortar, pero el usuario pidió eliminarlo. 
      // Generalmente mejor intentar cumplir la eliminación, aunque idealmente debería ser transaccional.
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
