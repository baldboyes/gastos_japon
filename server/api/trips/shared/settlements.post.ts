import { createItem } from '@directus/sdk'
import { assertTripAccess, createAdminClient, getDirectusUserIdFromEvent } from '../../../utils/directus-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const tripId = Number(body?.tripId)
  const fromTripUserId = Number(body?.from_trip_user_id)
  const toTripUserId = Number(body?.to_trip_user_id)
  const amount = Math.round(Number(body?.amount))
  const date = String(body?.date || '')
  const settlementStatus = String(body?.settlement_status || 'pending')

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }
  if (!Number.isFinite(fromTripUserId) || fromTripUserId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid from_trip_user_id' })
  }
  if (!Number.isFinite(toTripUserId) || toTripUserId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid to_trip_user_id' })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid amount' })
  }
  if (!date) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const result = await adminClient.request(createItem('trip_settlements', {
    status: 'published',
    trip_id: tripId,
    from_trip_user_id: fromTripUserId,
    to_trip_user_id: toTripUserId,
    amount,
    date,
    settlement_status: settlementStatus,
    settled_at: body?.settled_at || null,
    note: body?.note || null
  } as any))

  return { settlement: result }
})
