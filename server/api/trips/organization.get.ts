import { createDirectus, rest, readItems, readUsers, staticToken } from '@directus/sdk'

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

  const query = getQuery(event)
  const tripIdRaw = query.tripId
  const tripId = typeof tripIdRaw === 'string' ? Number(tripIdRaw) : Array.isArray(tripIdRaw) ? Number(tripIdRaw[0]) : Number(tripIdRaw)

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }

  const emails = extractEmailsFromClaims(sessionClaims)
  const email = emails[0]
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email' })
  }

  const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN
  if (!adminToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing DIRECTUS_ADMIN_TOKEN' })
  }

  const adminClient = createDirectus(directusUrl)
    .with(staticToken(adminToken))
    .with(rest())

  const users = await adminClient.request(readUsers({
    filter: { email: { _eq: String(email).trim().toLowerCase() } },
    fields: ['id', 'email'],
    limit: 1
  })) as any[]

  const directusUserId = users && users.length > 0 ? users[0].id : null
  if (!directusUserId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const [linksNew, linksLegacy, ownerTrips] = await Promise.all([
    adminClient.request(readItems('trips_users', {
      filter: { _and: [{ trip_id: { _eq: tripId } }, { directus_user_id: { _eq: directusUserId } }] },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any,
    adminClient.request(readItems('viajes_usuarios', {
      filter: { _and: [{ viaje_id: { _eq: tripId } }, { directus_user_id: { _eq: directusUserId } }] },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any,
    adminClient.request(readItems('trips', {
      filter: { _and: [{ id: { _eq: tripId } }, { user_created: { _eq: directusUserId } }] },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any
  ])

  const ok = (linksNew && linksNew.length > 0) || (linksLegacy && linksLegacy.length > 0) || (ownerTrips && ownerTrips.length > 0)
  if (!ok) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const queryFor = (sortField: string) => ({
    filter: { trip_id: { _eq: tripId } },
    sort: [sortField],
    fields: ['*'],
    limit: -1
  })

  const [flights, accommodations, transports, activities, insurances] = await Promise.all([
    adminClient.request(readItems('flights', queryFor('departure_time'))).catch(() => []) as any,
    adminClient.request(readItems('accommodations', queryFor('check_in'))).catch(() => []) as any,
    adminClient.request(readItems('transports', queryFor('start_date'))).catch(() => []) as any,
    adminClient.request(readItems('activities', queryFor('start_date'))).catch(() => []) as any,
    adminClient.request(readItems('insurances', queryFor('start_date'))).catch(() => []) as any
  ])

  return { flights, accommodations, transports, activities, insurances }
})

