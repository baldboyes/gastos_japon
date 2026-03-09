import { readItems } from '@directus/sdk'
import { assertTripAccess, createAdminClient, getDirectusUserIdFromEvent } from '../../../utils/directus-admin'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tripIdRaw = query.tripId
  const tripId = typeof tripIdRaw === 'string' ? Number(tripIdRaw) : Array.isArray(tripIdRaw) ? Number(tripIdRaw[0]) : Number(tripIdRaw)

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const result = await adminClient.request(readItems('trip_settlements', {
    filter: { trip_id: { _eq: tripId }, status: { _neq: 'archived' } },
    fields: ['id', 'trip_id', 'from_trip_user_id', 'to_trip_user_id', 'amount', 'date', 'settlement_status', 'settled_at', 'status'],
    sort: ['-date'],
    limit: -1
  })).catch(() => [])

  return { settlements: Array.isArray(result) ? result : [] }
})
