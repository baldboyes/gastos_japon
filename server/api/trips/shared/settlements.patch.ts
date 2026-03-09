import { readItem, updateItem } from '@directus/sdk'
import { assertTripAccess, createAdminClient, getDirectusUserIdFromEvent } from '../../../utils/directus-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const tripId = Number(body?.tripId)
  const id = Number(body?.id)
  const updates = body?.updates && typeof body.updates === 'object' ? body.updates : null

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }
  if (!updates) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid updates' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const current = await adminClient.request(readItem('trip_settlements', id, {
    fields: ['id', 'trip_id', 'settlement_status']
  })).catch(() => null) as any

  const currentTripId = typeof current?.trip_id === 'object' && current?.trip_id !== null ? current.trip_id.id : current?.trip_id
  if (!current || Number(currentTripId) !== tripId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  if (current?.settlement_status === 'completed') {
    throw createError({ statusCode: 409, statusMessage: 'shared_expense_locked' })
  }

  const result = await adminClient.request(updateItem('trip_settlements', id, updates as any))
  return { settlement: result }
})
