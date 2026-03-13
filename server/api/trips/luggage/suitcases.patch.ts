import { createDirectus, rest, readItem, readItems, readUsers, staticToken, updateItem } from '@directus/sdk'

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
  const { userId: clerkUserId, sessionClaims } = authContext || {}

  if (!clerkUserId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const tripId = Number(body?.tripId)
  const suitcaseId = Number(body?.id)
  const nameRaw = body?.name
  const typeRaw = body?.type

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }
  if (!Number.isFinite(suitcaseId) || suitcaseId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const updates: any = {}
  if (nameRaw !== undefined) {
    const name = String(nameRaw || '').trim()
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid name' })
    }
    updates.name = name
  }
  if (typeRaw !== undefined) {
    const type = String(typeRaw || '').trim()
    if (!['checked', 'carry_on', 'backpack', 'other'].includes(type)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid type' })
    }
    updates.type = type
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No updates provided' })
  }

  const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN
  if (!adminToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing DIRECTUS_ADMIN_TOKEN' })
  }

  const adminClient = createDirectus(directusUrl)
    .with(staticToken(adminToken))
    .with(rest())

  const emails = extractEmailsFromClaims(sessionClaims)
  const email = emails[0]

  const users = email
    ? await adminClient.request(readUsers({
        filter: { email: { _eq: String(email).trim().toLowerCase() } },
        fields: ['id', 'email'],
        limit: 1
      })).catch(() => []) as any[]
    : clerkUserId
      ? await adminClient.request(readUsers({
          filter: { external_identifier: { _eq: String(clerkUserId) } },
          fields: ['id', 'email'],
          limit: 1
        })).catch(() => []) as any[]
      : []

  const directusUserId = users && users.length > 0 ? users[0].id : null
  if (!directusUserId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const ownerLink = await adminClient.request(readItems('trips', {
    filter: { id: { _eq: tripId }, user_created: { _eq: directusUserId } },
    fields: ['id'],
    limit: 1
  })).catch(() => []) as any[]

  const isOwner = ownerLink && ownerLink.length > 0
  if (!isOwner) {
    const links = await adminClient.request(readItems('trips_users', {
      filter: { _and: [{ trip_id: { _eq: tripId } }, { directus_user_id: { _eq: directusUserId } }] },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any[]

    const ok = links && links.length > 0
    if (!ok) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const suitcase = await adminClient.request(readItem('suitcases', suitcaseId, {
    fields: ['id', 'trip_id']
  })).catch(() => null) as any

  if (!suitcase || Number(suitcase.trip_id) !== tripId) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const updated = await adminClient.request(updateItem('suitcases', suitcaseId, updates))

  return { suitcase: updated }
})

