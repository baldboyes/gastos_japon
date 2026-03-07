import { createDirectus, rest, createItem, updateItem, readItem, readItems, staticToken } from '@directus/sdk'
import { decryptInviteToken } from '../../utils/invite-token'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { notificationId, accept, userId } = body

    if (!notificationId || userId === undefined) {
      return { success: false, error: 'Missing required fields' }
    }

    const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN

    if (!adminToken) {
      return { success: false, error: 'Missing DIRECTUS_ADMIN_TOKEN' }
    }
    
    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // 1. Obtener la notificación para verificar y extraer tripId
    const notification = await adminClient.request(readItem('notifications', notificationId))

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    // Verificar que la notificación pertenece al usuario que responde
    if (notification.recipient_id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const inviteIdMatch = String(notification.action_link || '').match(/[?&]inviteId=(\d+)/)
    const inviteId = inviteIdMatch ? parseInt(inviteIdMatch[1]) : null

    const match = notification.action_link?.match(/\/trips\/(\d+)\/join/)
    const tripIdFromPath = match ? parseInt(match[1]) : null

    let tripId: number | null = tripIdFromPath
    let tripRole: 'editor' | 'read_only' = 'editor'

    const tokenMatch = String(notification.action_link || '').match(/[?&]token=([^&]+)/)
    const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null
    const inviteSecret = process.env.INVITE_TOKEN_SECRET || process.env.NUXT_INVITE_TOKEN_SECRET || ''

    if (inviteId) {
      const invitation = await adminClient.request(readItem('trip_invitations', inviteId, {
        fields: ['id', 'trip_id', 'role', 'status']
      })) as any

      const invitationTripId = typeof invitation?.trip_id === 'object' && invitation?.trip_id !== null ? invitation.trip_id.id : invitation?.trip_id
      if (invitationTripId) {
        tripId = Number(invitationTripId)
      }
      tripRole = invitation?.role === 'read_only' ? 'read_only' : 'editor'
    } else if (token && inviteSecret) {
      const payload = decryptInviteToken(token, inviteSecret)
      const tokenInviteId = Number(payload?.inviteId)
      if (!Number.isFinite(tokenInviteId) || tokenInviteId <= 0) {
        return { success: false, error: 'Invalid invite token' }
      }
      const invitation = await adminClient.request(readItem('trip_invitations', tokenInviteId, {
        fields: ['id', 'trip_id', 'role', 'status', 'email']
      })) as any

      const invitationTripId = typeof invitation?.trip_id === 'object' && invitation?.trip_id !== null ? invitation.trip_id.id : invitation?.trip_id
      if (invitationTripId) {
        tripId = Number(invitationTripId)
      }
      tripRole = invitation?.role === 'read_only' ? 'read_only' : 'editor'
    } else {
      const roleMatch = String(notification.action_link || '').match(/[?&]role=([^&]+)/)
      tripRole = roleMatch && roleMatch[1] === 'read_only' ? 'read_only' : 'editor'
    }

    if (!tripId) {
      return { success: false, error: 'Invalid trip ID in notification' }
    }

    if (accept) {
      const existingAssociation = await adminClient.request(readItems('trips_users', {
        filter: {
          _and: [
            { trip_id: { _eq: tripId } },
            { directus_user_id: { _eq: userId } }
          ]
        },
        limit: 1
      })) as any[]

      if (!existingAssociation || existingAssociation.length === 0) {
        await adminClient.request(createItem('trips_users', {
          trip_id: tripId,
          directus_user_id: userId,
          rol: tripRole,
          status: 'published'
        }))
      }

      if (inviteId) {
        await adminClient.request(updateItem('trip_invitations', inviteId, { status: 'accepted' }))
      }

      // Notificar al dueño del viaje (opcional, si user_created está disponible)
      if (notification.user_created) {
        await adminClient.request(createItem('notifications', {
          recipient_id: notification.user_created,
          title: 'Invitación aceptada',
          message: `Un usuario ha aceptado tu invitación al viaje.`,
          type: 'success',
          status: 'published'
        }))
      }
    } else if (inviteId) {
      await adminClient.request(updateItem('trip_invitations', inviteId, { status: 'revoked' }))
    }

    // Marcar notificación original como leída (o archivada/borrada según lógica de negocio)
    // Aquí solo marcamos como leída y quizás actualizamos el mensaje para decir "Aceptada" o "Rechazada"
    await adminClient.request(updateItem('notifications', notificationId, {
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
