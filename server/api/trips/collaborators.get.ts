import { createDirectus, rest, readItem, readItems, readUsers, staticToken } from '@directus/sdk'

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
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // DEBUG
    if (!sessionClaims) {
      console.warn('[Collaborators] No sessionClaims found for userId:', clerkUserId)
    } else {
      console.log('[Collaborators] sessionClaims:', JSON.stringify(sessionClaims, null, 2))
    }

    const query = getQuery(event)
    const tripIdRaw = query.tripId
    const tripId = typeof tripIdRaw === 'string' ? Number(tripIdRaw) : Array.isArray(tripIdRaw) ? Number(tripIdRaw[0]) : Number(tripIdRaw)

    if (!tripId || Number.isNaN(tripId)) {
      throw createError({ statusCode: 400, statusMessage: 'Missing tripId' })
    }

    const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN

    if (!adminToken) {
      console.error('Missing DIRECTUS_ADMIN_TOKEN')
      throw createError({ statusCode: 500, statusMessage: 'Missing DIRECTUS_ADMIN_TOKEN' })
    }

    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // 1. Get current user's Directus ID
    const emails = extractEmailsFromClaims(sessionClaims)
    // Fallback: if sessionClaims doesn't have email, try to fetch user from Clerk API (optional, but let's first check logs)
    // Or check if 'email' is in top level of sessionClaims (sometimes it is)
    
    let email = emails[0]
    if (!email && (sessionClaims as any)?.email) {
      email = (sessionClaims as any).email
    }
 
    let directusUserId: string | null = null

    if (email) {
      const currentUserResult = await adminClient.request(readUsers({
        filter: { email: { _eq: String(email).trim().toLowerCase() } },
        fields: ['id'],
        limit: 1
      })).catch((e) => {
        console.error('Error fetching current user:', e)
        return []
      }) as any[]

      if (currentUserResult && currentUserResult.length > 0) {
        directusUserId = currentUserResult[0].id
      }
    }

    // Fallback: if email lookup failed or email was missing, try external_identifier (Clerk ID)
    if (!directusUserId && clerkUserId) {
      const userByIdResult = await adminClient.request(readUsers({
        filter: { external_identifier: { _eq: clerkUserId } },
        fields: ['id'],
        limit: 1
      })).catch((e) => {
        console.error('Error fetching current user by external_identifier:', e)
        return []
      }) as any[]

      if (userByIdResult && userByIdResult.length > 0) {
        directusUserId = userByIdResult[0].id
      }
    }
 
    if (!directusUserId) {
      if (!email) {
         console.error('[Collaborators] Missing email in claims and user not found by ID:', JSON.stringify(sessionClaims))
         throw createError({ statusCode: 400, statusMessage: 'Missing email and user not found' })
      }
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: User not found in Directus' })
    }

    // 2. Fetch Trip & Check Access
    let trip
    try {
      trip = await adminClient.request(readItem('trips', tripId, { fields: ['user_created'] })) as any
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.errors?.[0]?.extensions?.code === 'FORBIDDEN') {
        throw createError({ statusCode: 404, statusMessage: 'Trip not found' })
      }
      throw error
    }

    const ownerId = typeof trip?.user_created === 'object' && trip?.user_created !== null ? trip.user_created.id : trip?.user_created
    const isOwner = ownerId === directusUserId

    // 3. Fetch Relations (Collaborators)
    const relations = await adminClient.request(readItems('trips_users', {
      filter: { trip_id: { _eq: tripId } },
      fields: ['id', 'directus_user_id', 'rol'],
      limit: -1
    })).catch((e) => {
      console.error('Error fetching trips_users:', e)
      return []
    }) as any[]

    const isCollaborator = (relations || []).some((r: any) => r.directus_user_id === directusUserId)

    if (!isOwner && !isCollaborator) {
      // If user is neither owner nor collaborator, they cannot see the collaborators list
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const ownerUsers = ownerId
      ? await adminClient.request(readUsers({
          filter: { id: { _eq: ownerId } },
          fields: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
          limit: 1
        })).catch((e) => {
          console.error('Error fetching owner:', e)
          return []
        })
      : []
    const owner = Array.isArray(ownerUsers) && ownerUsers.length > 0 ? ownerUsers[0] : null

    const userIds = (relations || []).map((r: any) => r.directus_user_id).filter(Boolean)
    const users = userIds.length > 0
      ? await adminClient.request(readUsers({
          filter: { id: { _in: userIds } },
          fields: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
          limit: -1
        })).catch((e) => {
          console.error('Error fetching users:', e)
          return []
        })
      : []

    const userById = new Map((users || []).map((u: any) => [u.id, u]))

    const collaborators = (relations || []).map((r: any) => {
      const u = userById.get(r.directus_user_id)
      if (!u) return null
      return {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        avatar_url: u.avatar_url,
        relationId: r.id,
        role: ownerId && u.id === ownerId ? 'owner' : (r.rol || 'collaborator')
      }
    }).filter(Boolean) as any[]

    if (owner && owner.id) {
      const existing = collaborators.find((c: any) => c?.id === owner.id)
      if (existing) {
        existing.role = 'owner'
        if (!existing.avatar_url) existing.avatar_url = owner.avatar_url
        if (!existing.first_name) existing.first_name = owner.first_name
        if (!existing.last_name) existing.last_name = owner.last_name
        if (!existing.email) existing.email = owner.email
      } else {
        collaborators.unshift({
          id: owner.id,
          first_name: owner.first_name,
          last_name: owner.last_name,
          email: owner.email,
          avatar_url: owner.avatar_url,
          relationId: null,
          role: 'owner'
        })
      }
    }

    return { collaborators }
  } catch (error: any) {
    // Silence expected 404s
    if (error.statusCode === 404 || error.statusMessage === 'Trip not found') {
      throw error
    }
    console.error('API Error /trips/collaborators:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})
