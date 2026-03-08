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
    return { trips: [] }
  }

  const links = await adminClient.request(readItems('trips_users', {
    filter: { directus_user_id: { _eq: directusUserId } },
    fields: ['trip_id'],
    limit: -1
  })).catch(() => []) as any

  const invitedTripIds = new Set<number>()
  for (const r of (links || [])) {
    const id = Number((r as any)?.trip_id)
    if (Number.isFinite(id)) invitedTripIds.add(id)
  }

  const invitedIdsArray = Array.from(invitedTripIds)

  const trips = await adminClient.request(readItems('trips', {
    sort: ['-start_date'],
    fields: [
      '*',
      'user_created'
    ],
    filter: invitedIdsArray.length > 0
      ? {
        _or: [
          { user_created: { _eq: directusUserId } },
          { id: { _in: invitedIdsArray } }
        ]
      }
      : { user_created: { _eq: directusUserId } },
    limit: -1
  })) as any[]

  const ownerIds = Array.from(new Set((trips || [])
    .map((t: any) => t?.user_created)
    .filter((v: any) => typeof v === 'string' && v.length > 0)))

  const ownerUsers = ownerIds.length > 0
    ? await adminClient.request(readUsers({
        filter: { id: { _in: ownerIds } },
        fields: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
        limit: -1
      })).catch(() => []) as any[]
    : []

  const ownerById = new Map<string, any>()
  for (const u of ownerUsers || []) {
    if (u?.id) ownerById.set(u.id, u)
  }

  const tripIds = (trips || []).map((t: any) => Number(t?.id)).filter((n: number) => Number.isFinite(n))
  const relations = tripIds.length > 0
    ? await adminClient.request(readItems('trips_users', {
        filter: { trip_id: { _in: tripIds } },
        fields: [
          'id',
          'trip_id',
          'rol',
          'directus_user_id.id',
          'directus_user_id.first_name',
          'directus_user_id.last_name',
          'directus_user_id.avatar_url'
        ],
        limit: -1
      })).catch(() => []) as any[]
    : []

  const usersByTrip = new Map<number, any[]>()
  for (const r of relations || []) {
    const tripId = Number((r as any)?.trip_id)
    if (!Number.isFinite(tripId)) continue
    const u = (r as any)?.directus_user_id
    if (!u) continue
    const arr = usersByTrip.get(tripId) || []
    arr.push({ ...u, role: (r as any)?.rol || 'collaborator' })
    usersByTrip.set(tripId, arr)
  }

  const enriched = (trips || []).map((t: any) => {
    const rawOwnerId = typeof t?.user_created === 'string' ? t.user_created : null
    const ownerUser = rawOwnerId ? ownerById.get(rawOwnerId) : null
    const userCreated = ownerUser || t.user_created
    const ownerId = typeof userCreated === 'object' && userCreated !== null ? userCreated.id : userCreated
    const collabs = (usersByTrip.get(Number(t?.id)) || []).filter((u: any) => u?.id && u.id !== ownerId)
    return { ...t, user_created: userCreated, collaborators: collabs }
  })

  return { trips: enriched }
})
