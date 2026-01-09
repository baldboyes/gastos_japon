import { createDirectus, rest, createItem, updateItem, readItem, staticToken } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { notificationId, accept, userId } = body

    if (!notificationId || userId === undefined) {
      return { success: false, error: 'Missing required fields' }
    }

    const directusUrl = 'https://api.mevoyajapon.com'
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || 'DirectusAdmin2026!'
    
    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // 1. Obtener la notificación para verificar y extraer tripId
    const notification = await adminClient.request(readItem('notificaciones', notificationId))

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    // Verificar que la notificación pertenece al usuario que responde
    if (notification.recipient_id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Extraer tripId del action_link (formato esperado: /trips/123/join?invite=true)
    const match = notification.action_link?.match(/\/trips\/(\d+)\/join/)
    const tripId = match ? parseInt(match[1]) : null

    if (!tripId) {
      return { success: false, error: 'Invalid trip ID in notification' }
    }

    if (accept) {
      // Crear asociación
      await adminClient.request(createItem('viajes_usuarios', {
        viaje_id: tripId,
        directus_user_id: userId,
        rol: 'editor', // Por defecto editor, podría ser configurable
        status: 'published'
      }))

      // Notificar al dueño del viaje (opcional, si user_created está disponible)
      if (notification.user_created) {
        await adminClient.request(createItem('notificaciones', {
          recipient_id: notification.user_created,
          title: 'Invitación aceptada',
          message: `Un usuario ha aceptado tu invitación al viaje.`,
          type: 'success',
          status: 'published'
        }))
      }
    }

    // Marcar notificación original como leída (o archivada/borrada según lógica de negocio)
    // Aquí solo marcamos como leída y quizás actualizamos el mensaje para decir "Aceptada" o "Rechazada"
    await adminClient.request(updateItem('notificaciones', notificationId, {
      read_at: new Date().toISOString(),
      // Opcional: Modificar título para reflejar estado
      title: `${notification.title} (${accept ? 'Aceptada' : 'Rechazada'})`
    }))

    return { success: true }

  } catch (error: any) {
    console.error('[RESPOND] Error:', error)
    return { 
        success: false, 
        error: error.message || 'Internal Server Error'
    }
  }
})
