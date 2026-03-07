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
      'user_created.first_name',
      'user_created.last_name',
      'user_created.avatar_url'
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

  return { trips }
})
