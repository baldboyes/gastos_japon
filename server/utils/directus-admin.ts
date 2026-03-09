import { createDirectus, rest, staticToken, readUsers, readItems } from '@directus/sdk'

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

export const createAdminClient = () => {
  const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN
  if (!adminToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing DIRECTUS_ADMIN_TOKEN' })
  }

  return createDirectus(directusUrl).with(staticToken(adminToken)).with(rest())
}

export const getDirectusUserIdFromEvent = async (event: any, adminClient: any) => {
  const authValue = (event.context as any).auth
  const authContext = typeof authValue === 'function'
    ? await authValue()
    : authValue
  const { userId: clerkUserId, sessionClaims } = authContext || {}

  if (!clerkUserId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const emails = extractEmailsFromClaims(sessionClaims)
  let email = emails[0]
  if (!email && (sessionClaims as any)?.email) email = (sessionClaims as any).email

  if (email) {
    const byEmail = await adminClient.request(readUsers({
      filter: { email: { _eq: String(email).trim().toLowerCase() } },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any[]

    if (Array.isArray(byEmail) && byEmail.length > 0) return byEmail[0].id as string
  }

  const byExternal = await adminClient.request(readUsers({
    filter: { external_identifier: { _eq: clerkUserId } },
    fields: ['id'],
    limit: 1
  })).catch(() => []) as any[]

  if (Array.isArray(byExternal) && byExternal.length > 0) return byExternal[0].id as string

  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}

export const assertTripAccess = async (adminClient: any, tripId: number, directusUserId: string) => {
  const [links, ownerTrips] = await Promise.all([
    adminClient.request(readItems('trips_users', {
      filter: { _and: [{ trip_id: { _eq: tripId } }, { directus_user_id: { _eq: directusUserId } }] },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any,
    adminClient.request(readItems('trips', {
      filter: { _and: [{ id: { _eq: tripId } }, { user_created: { _eq: directusUserId } }] },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any
  ])

  const ok = (links && links.length > 0) || (ownerTrips && ownerTrips.length > 0)
  if (!ok) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}

