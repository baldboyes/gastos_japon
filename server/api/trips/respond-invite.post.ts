import { createDirectus, rest, createItem, updateItem, readItem, readItems, readUsers, staticToken } from '@directus/sdk'
import { decryptInviteToken } from '../../utils/invite-token'

const extractEmailsFromClaims = (claims: any): string[] => {
  const out = new Set<string>()
  const push = (v: any) => {
    if (typeof v === 'string' && v.includes('@')) out.add(v.trim().toLowerCase())
  }

  if (!claims || typeof claims !== 'object') return []

  push((claims as any).email)
  push((claims as any).primary_email)
  push((claims as any).primaryEmail)
  push((claims as any).email_address)

  const emails = (claims as any).email_addresses
  if (Array.isArray(emails)) {
    for (const e of emails) {
      if (typeof e === 'string') push(e)
      else push(e?.email_address)
    }
  }

  return Array.from(out)
}

export default defineEventHandler(async (event) => {
  try {
    const authValue = (event.context as any).auth
    const authContext = typeof authValue === 'function'
      ? await authValue()
      : authValue
    const { userId: clerkUserId, sessionClaims } = authContext || {}

    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized' }
    }

    const body = await readBody(event)
    const { notificationId, accept, actionLink, userId } = body

    if (!notificationId) {
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

    let directusUserId: string | null = typeof userId === 'string' && userId.length > 0 ? userId : null
    if (!directusUserId) {
      const emails = extractEmailsFromClaims(sessionClaims)
      const email = emails[0]
      if (!email) {
        return { success: false, error: 'Missing email' }
      }

      const users = await adminClient.request(readUsers({
        filter: { email: { _eq: String(email).trim().toLowerCase() } },
        fields: ['id', 'email'],
        limit: 1
      })) as any[]

      directusUserId = users && users.length > 0 ? users[0].id : null
      if (!directusUserId) {
        return { success: false, error: 'Forbidden' }
      }
    }

    const link = typeof actionLink === 'string' && actionLink.length > 0
      ? actionLink
      : null

    // Fallback: si no llega actionLink, intentamos leerlo desde la notificación
    let notification: any = null
    if (!link) {
      notification = await adminClient.request(readItem('notifications', notificationId))
    }

    if (!notification) {
      if (!link) return { success: false, error: 'Notification not found' }
    }

    // Si hemos podido leer la notificación, validamos ownership
    if (notification?.recipient_id && notification.recipient_id !== directusUserId) {
      return { success: false, error: 'Unauthorized' }
    }

    const effectiveLink = link || String(notification.action_link || '')
    const inviteIdMatch = effectiveLink.match(/[?&]inviteId=(\d+)/)
    const inviteId = inviteIdMatch ? parseInt(inviteIdMatch[1]) : null

    const match = effectiveLink.match(/\/trips\/(\d+)\/join/)
    const tripIdFromPath = match ? parseInt(match[1]) : null

    let tripId: number | null = tripIdFromPath
    let tripRole: 'editor' | 'read_only' = 'editor'

    const tokenMatch = effectiveLink.match(/[?&]token=([^&]+)/)
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
      const roleMatch = effectiveLink.match(/[?&]role=([^&]+)/)
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
            { directus_user_id: { _eq: directusUserId } }
          ]
        },
        limit: 1
      })) as any[]

      if (!existingAssociation || existingAssociation.length === 0) {
        await adminClient.request(createItem('trips_users', {
          trip_id: tripId,
          directus_user_id: directusUserId,
          rol: tripRole,
          status: 'published'
        }))
      }

      if (inviteId) {
        await adminClient.request(updateItem('trip_invitations', inviteId, { status: 'accepted' }))
      }

      // Notificar al dueño del viaje (opcional, si user_created está disponible)
      if (notification?.user_created) {
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

    if (notification) {
      try {
        await adminClient.request(updateItem('notifications', notificationId, {
          read_at: new Date().toISOString(),
          title: `${notification.title} (${accept ? 'Aceptada' : 'Rechazada'})`
        }))
      } catch {}
    }

    return { success: true }

  } catch (error: any) {
    console.error('[RESPOND] Error:', error)
    return { 
        success: false, 
        error: error.message || 'Internal Server Error'
    }
  }
})
