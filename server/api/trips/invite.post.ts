import { createDirectus, rest, createItem, readItems, readUsers, updateItem, staticToken } from '@directus/sdk'
import { buildInviteEmailContent } from '../../utils/invite-templates'
import { createInviteToken } from '../../utils/invite-token'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, tripId, tripName, inviterName, inviterId, inviterEmail, role, locale } = body

    if (!email || !tripId) {
      return { success: false, error: 'Missing required fields' }
    }

    const emailStr = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return { success: false, error: 'Invalid email' }
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
    const publicAppUrl = process.env.PUBLIC_APP_URL || 'https://jizou.io'
    const webhookUrl = process.env.N8N_INVITE_WEBHOOK_URL || 'https://n8n.mevoyajapon.com/webhook/jizou-invitacion'

    const localeRaw = String(locale || '').trim().toLowerCase()
    const localeBase = (localeRaw.includes('-') ? localeRaw.split('-')[0] : localeRaw)
    const normalizedLocale = localeBase === 'es' || localeBase === 'en' || localeBase === 'ja' ? localeBase : 'en'
    const tripRole: 'editor' | 'read_only' = role === 'read_only' ? 'read_only' : 'editor'

    const inviteSecret = process.env.INVITE_TOKEN_SECRET || process.env.NUXT_INVITE_TOKEN_SECRET || ''


    // 1. Buscar usuario por email (usando readUsers para colección de sistema)
    const users = await adminClient.request(readUsers({
      filter: {
        email: {
          _eq: emailStr
        }
      },
      limit: 1
    }))

    const existingUser = users && users.length > 0 ? users[0] : null

    if (existingUser) {
      // Caso 1: Usuario existe -> Crear Notificación
      
      // Verificar si ya está asociado
      const existingAssociation = await adminClient.request(readItems('trips_users', {
        filter: {
          _and: [
            { trip_id: { _eq: tripId } },
            { directus_user_id: { _eq: existingUser.id } }
          ]
        },
        limit: 1
      }))

      if (existingAssociation && existingAssociation.length > 0) {
        return { success: false, error: 'User already in trip' }
      }

      const existingInvite = await adminClient.request(readItems('trip_invitations', {
        filter: {
          _and: [
            { email: { _eq: emailStr } },
            { trip_id: { _eq: tripId } },
            { status: { _starts_with: 'pending' } }
          ]
        },
        limit: 1
      })) as any[]

      const inviteId = existingInvite && existingInvite.length > 0 ? existingInvite[0].id : null

      if (inviteId) {
        await adminClient.request(updateItem('trip_invitations', inviteId, {
          inviter_id: inviterId,
          inviter_email: inviterEmail ? String(inviterEmail) : null,
          role: tripRole,
          status: 'pending'
        }))
      } else {
        const invitation = await adminClient.request(createItem('trip_invitations', {
          email: emailStr,
          trip_id: tripId,
          inviter_id: inviterId,
          inviter_email: inviterEmail ? String(inviterEmail) : null,
          role: tripRole,
          status: 'pending'
        }))
        existingInvite.push(invitation)
      }

      const resolvedInviteId = (existingInvite && existingInvite.length > 0 ? existingInvite[0].id : null) as number | null
      const token = (resolvedInviteId && inviteSecret)
        ? createInviteToken({ inviteId: resolvedInviteId, email: emailStr, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }, inviteSecret)
        : null
      const actionLink = token
        ? `/trips/${tripId}/join?token=${encodeURIComponent(token)}`
        : `/trips/${tripId}/join?inviteId=${resolvedInviteId}`

      const notification = await adminClient.request(createItem('notifications', {
        recipient_id: existingUser.id,
        title: `Invitación a viaje: ${tripName}`,
        message: `${inviterName} te ha invitado a colaborar en el viaje "${tripName}".`,
        type: 'invite',
        action_link: actionLink,
        status: 'published',
        user_created: inviterId
      }))

      const { locale: resolvedLocale, subject, text, html } = buildInviteEmailContent({
        locale,
        inviterName: String(inviterName || ''),
        inviterEmail: inviterEmail ? String(inviterEmail) : undefined,
        tripName: String(tripName || ''),
        actionUrl: `${publicAppUrl}/${normalizedLocale}${actionLink}`,
        isExistingUser: true
      })

      let deliveryOk = false
      let deliveryStatusCode: number | undefined
      let deliveryError: string | undefined

      try {
        await $fetch(webhookUrl, {
          method: 'POST',
          body: {
            to: emailStr,
            subject,
            text,
            html,
            locale: resolvedLocale,
            tripId,
            inviteId: resolvedInviteId,
            tripName,
            inviterName,
            inviterEmail,
            inviterId,
            record: { collection: 'notifications', id: (notification as any)?.id }
          }
        })
        deliveryOk = true
      } catch (e: any) {
        deliveryOk = false
        deliveryStatusCode = e?.statusCode
        deliveryError = e?.data?.message || e?.message || String(e)
      }

      return {
        success: true, 
        status: 'invited', 
        emailSent: deliveryOk,
        delivery: { method: 'n8n', ok: deliveryOk, statusCode: deliveryStatusCode, error: deliveryError },
        record: { collection: 'notifications', id: (notification as any)?.id },
        message: deliveryOk
          ? 'Invitación enviada (notificación y email).'
          : 'Invitación creada (notificación), pero no se pudo enviar el email.'
      }
    } else {
      // Caso 2: Usuario NO existe -> Crear invitación en BD y mandar email
      
      const invitation = await adminClient.request(createItem('trip_invitations', {
        email: emailStr,
        trip_id: tripId,
        inviter_id: inviterId,
        inviter_email: inviterEmail ? String(inviterEmail) : null,
        role: tripRole,
        status: 'pending'
      }))

      const inviteId = (invitation as any)?.id
      const token = (inviteId && inviteSecret)
        ? createInviteToken({ inviteId, email: emailStr, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }, inviteSecret)
        : null
      const { locale: resolvedLocale, subject, text, html } = buildInviteEmailContent({
        locale,
        inviterName: String(inviterName || ''),
        inviterEmail: inviterEmail ? String(inviterEmail) : undefined,
        tripName: String(tripName || ''),
        actionUrl: token
          ? `${publicAppUrl}/${normalizedLocale}/trips/${tripId}/join?token=${encodeURIComponent(token)}`
          : `${publicAppUrl}/${normalizedLocale}/trips/${tripId}/join?inviteId=${inviteId}`,
        isExistingUser: false
      })

      let deliveryOk = false
      let deliveryStatusCode: number | undefined
      let deliveryError: string | undefined
      try {
        await $fetch(webhookUrl, {
          method: 'POST',
          body: {
            to: emailStr,
            subject,
            text,
            html,
            locale: resolvedLocale,
            tripId,
            inviteId,
            tripName,
            inviterName,
            inviterEmail,
            inviterId,
            record: { collection: 'trip_invitations', id: (invitation as any)?.id }
          }
        })
        deliveryOk = true
      } catch (e: any) {
        deliveryOk = false
        deliveryStatusCode = e?.statusCode
        deliveryError = e?.data?.message || e?.message || String(e)
      }

      return { 
        success: true, 
        status: deliveryOk ? 'email_sent' : 'invitation_created',
        emailSent: deliveryOk,
        delivery: { method: 'n8n', ok: deliveryOk, statusCode: deliveryStatusCode, error: deliveryError },
        record: { collection: 'trip_invitations', id: (invitation as any)?.id },
        message: deliveryOk 
          ? 'Usuario no registrado. Invitación creada y email enviado.' 
          : 'Usuario no registrado. Invitación creada, pero no se pudo enviar el email.'
      }
    }

  } catch (error: any) {
    console.error('[INVITE] Error:', error)
    return { 
        success: false, 
        error: error.message || 'Internal Server Error'
    }
  }
})
