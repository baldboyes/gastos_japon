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

  const links = await adminClient.request(readItems('trips_users', {
    filter: { _and: [{ trip_id: { _eq: tripId } }, { directus_user_id: { _eq: directusUserId } }] },
    fields: ['id'],
    limit: 1
  })).catch(() => []) as any

  if (!links || links.length === 0) {
    const ownerTrips = await adminClient.request(readItems('trips', {
      filter: { _and: [{ id: { _eq: tripId } }, { user_created: { _eq: directusUserId } }] },
      fields: ['id'],
      limit: 1
    })).catch(() => []) as any

    if (!ownerTrips || ownerTrips.length === 0) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const tasks = await adminClient.request(readItems('tasks', {
    filter: { trip_id: { _eq: tripId } },
    sort: ['due_date'],
    fields: ['*', 'user_created', 'assigned_to'],
    limit: -1
  })).catch(() => []) as any[]

  const userIds = new Set<string>()
  for (const task of tasks || []) {
    const created = task?.user_created
    const assigned = task?.assigned_to
    if (typeof created === 'string' && created) userIds.add(created)
    if (typeof assigned === 'string' && assigned) userIds.add(assigned)
  }

  const userIdList = Array.from(userIds)
  const taskUsers = userIdList.length > 0
    ? await adminClient.request(readUsers({
        filter: { id: { _in: userIdList } },
        fields: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
        limit: -1
      })).catch(() => []) as any[]
    : []

  const userById = new Map<string, any>()
  for (const u of taskUsers || []) {
    if (u?.id) userById.set(u.id, u)
  }

  const enriched = (tasks || []).map((task: any) => {
    const created = typeof task?.user_created === 'string' ? userById.get(task.user_created) || task.user_created : task.user_created
    const assigned = typeof task?.assigned_to === 'string' ? userById.get(task.assigned_to) || task.assigned_to : task.assigned_to
    return { ...task, user_created: created, assigned_to: assigned }
  })

  return { tasks: enriched }
})

