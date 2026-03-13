import { readItems } from '@directus/sdk'
import { assertTripAccess, createAdminClient, getDirectusUserIdFromEvent } from '../../utils/directus-admin'

export default defineEventHandler(async (event) => {
  const authValue = (event.context as any).auth
  const authContext = typeof authValue === 'function'
    ? await authValue()
    : authValue
  const { userId: clerkUserId } = authContext || {}

  if (!clerkUserId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const tripIdRaw = query.tripId
  const dateRaw = query.date

  const tripId = typeof tripIdRaw === 'string' ? Number(tripIdRaw) : Array.isArray(tripIdRaw) ? Number(tripIdRaw[0]) : Number(tripIdRaw)
  const date = typeof dateRaw === 'string' ? dateRaw : Array.isArray(dateRaw) ? dateRaw[0] : ''

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const items = await adminClient.request(readItems('daily_notes', {
    filter: { trip_id: { _eq: tripId }, date: { _eq: date } },
    fields: ['id', 'content'],
    limit: 1
  })).catch(() => []) as any[]

  if (Array.isArray(items) && items.length > 0) {
    return { id: Number(items[0].id), content: String(items[0].content || '') }
  }

  return { id: null as number | null, content: '' }
})
