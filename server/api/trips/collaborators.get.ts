import { createDirectus, rest, readItem, readItems, readUsers, staticToken } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tripIdRaw = query.tripId
  const tripId = typeof tripIdRaw === 'string' ? Number(tripIdRaw) : Array.isArray(tripIdRaw) ? Number(tripIdRaw[0]) : Number(tripIdRaw)

  if (!tripId || Number.isNaN(tripId)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing tripId' })
  }

  const directusUrl = process.env.DIRECTUS_URL || 'https://directus.jizou.io'
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || process.env.NUXT_DIRECTUS_ADMIN_TOKEN

  if (!adminToken) {
    throw createError({ statusCode: 500, statusMessage: 'Missing DIRECTUS_ADMIN_TOKEN' })
  }

  const adminClient = createDirectus(directusUrl)
    .with(staticToken(adminToken))
    .with(rest())

  const trip = await adminClient.request(readItem('trips', tripId, { fields: ['user_created'] })) as any
  const ownerId = typeof trip?.user_created === 'object' && trip?.user_created !== null ? trip.user_created.id : trip?.user_created

  const relations = await adminClient.request(readItems('trips_users', {
    filter: { trip_id: { _eq: tripId } },
    fields: ['id', 'directus_user_id', 'rol'],
    limit: -1
  })) as any[]

  if (!relations || relations.length === 0) {
    const users = ownerId
      ? await adminClient.request(readUsers({ filter: { id: { _eq: ownerId } }, limit: 1 }))
      : []

    const owner = Array.isArray(users) && users.length > 0 ? users[0] : null
    const collaborators = owner
      ? [{
          id: owner.id,
          first_name: owner.first_name,
          last_name: owner.last_name,
          email: owner.email,
          avatar_url: owner.avatar_url,
          relationId: null,
          role: 'owner'
        }]
      : []

    return { collaborators }
  }

  const userIds = (relations || []).map((r: any) => r.directus_user_id).filter(Boolean)
  const users = userIds.length > 0
    ? await adminClient.request(readUsers({ filter: { id: { _in: userIds } }, limit: -1 }))
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
    })
    .filter(Boolean)

  return { collaborators }
})
