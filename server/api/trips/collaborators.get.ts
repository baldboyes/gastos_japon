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

  const ownerUsers = ownerId
    ? await adminClient.request(readUsers({
        filter: { id: { _eq: ownerId } },
        fields: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
        limit: 1
      })).catch(() => [])
    : []
  const owner = Array.isArray(ownerUsers) && ownerUsers.length > 0 ? ownerUsers[0] : null

  const userIds = (relations || []).map((r: any) => r.directus_user_id).filter(Boolean)
  const users = userIds.length > 0
    ? await adminClient.request(readUsers({
        filter: { id: { _in: userIds } },
        fields: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
        limit: -1
      })).catch(() => [])
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
})
