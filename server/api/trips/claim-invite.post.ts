import { createDirectus, rest, readItem, readItems, readUsers, createItem, updateItem, staticToken } from '@directus/sdk'
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
  const authValue = (event.context as any).auth
  const authContext = typeof authValue === 'function'
    ? await authValue()
    : authValue
  const { userId: clerkUserId, sessionClaims } = (authContext || {}) as any
  if (!clerkUserId) {
    return { error: 'Unauthorized', statusCode: 401 }
  }

  const body = await readBody(event)
  const token = typeof body?.token === 'string' ? body.token : null
  const inviteIdFromBody = Number(body?.inviteId)
  const inviteSecret = process.env.INVITE_TOKEN_SECRET || process.env.NUXT_INVITE_TOKEN_SECRET || ''

  const payload = token && inviteSecret
    ? decryptInviteToken(token, inviteSecret)
    : null

  const inviteId = payload?.inviteId || inviteIdFromBody

  if (!Number.isFinite(inviteId) || inviteId <= 0) {
    return { error: 'Invalid inviteId', statusCode: 400 }
  }

  const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN

  if (!adminToken) {
    return { error: 'Missing DIRECTUS_ADMIN_TOKEN', statusCode: 500 }
  }

  const adminClient = createDirectus(directusUrl)
    .with(staticToken(adminToken))
    .with(rest())

  const invitation = await adminClient.request(readItem('trip_invitations', inviteId, {
    fields: ['id', 'email', 'trip_id', 'role', 'status']
  })) as any

  if (!invitation) {
    return { error: 'Invitation not found', statusCode: 404 }
  }

  const status = String(invitation.status || '')
  if (!status.startsWith('pending')) {
    return { error: 'Invitation not pending', statusCode: 400 }
  }

  const inviteEmail = String(invitation.email || '').trim().toLowerCase()
  const tokenEmail = payload?.email ? String(payload.email).trim().toLowerCase() : null
  const exp = payload?.exp ? Number(payload.exp) : null
  if (exp && Math.floor(Date.now() / 1000) > exp) {
    return { error: 'Invitation expired', statusCode: 400 }
  }
  if (tokenEmail && tokenEmail !== inviteEmail) {
    return { error: 'Invitation token mismatch', statusCode: 403 }
  }
  const claimEmails = extractEmailsFromClaims(sessionClaims)

  if (claimEmails.length > 0 && !claimEmails.includes(inviteEmail)) {
    return { error: 'Invitation email mismatch', statusCode: 403 }
  }

  const users = await adminClient.request(readUsers({
    filter: { email: { _eq: inviteEmail } },
    fields: ['id', 'email'],
    limit: 1
  })) as any[]

  const directusUserId = users && users.length > 0 ? users[0].id : null
  if (!directusUserId) {
    return { error: 'Directus user not found', statusCode: 400 }
  }

  const tripId = typeof invitation.trip_id === 'object' && invitation.trip_id !== null ? invitation.trip_id.id : invitation.trip_id
  const tripRole = invitation.role === 'read_only' ? 'read_only' : 'editor'

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

  await adminClient.request(updateItem('trip_invitations', inviteId, {
    status: 'accepted'
  }))

  return { success: true, tripId, role: tripRole }
})
