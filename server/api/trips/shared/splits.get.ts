import { readItems } from '@directus/sdk'
import { assertTripAccess, createAdminClient, getDirectusUserIdFromEvent } from '../../../utils/directus-admin'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tripIdRaw = query.tripId
  const expenseIdRaw = query.expenseId
  const tripId = typeof tripIdRaw === 'string' ? Number(tripIdRaw) : Array.isArray(tripIdRaw) ? Number(tripIdRaw[0]) : Number(tripIdRaw)
  const expenseId = typeof expenseIdRaw === 'string' ? Number(expenseIdRaw) : Array.isArray(expenseIdRaw) ? Number(expenseIdRaw[0]) : Number(expenseIdRaw)

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const filter: any = { trip_id: { _eq: tripId }, status: { _neq: 'archived' } }
  if (Number.isFinite(expenseId) && expenseId > 0) filter.expense_id = { _eq: expenseId }

  const result = await adminClient.request(readItems('expense_splits', {
    filter,
    fields: ['id', 'trip_id', 'expense_id', 'trip_user_id', 'amount', 'percentage', 'settled', 'settled_at', 'status'],
    sort: ['expense_id', 'trip_user_id'],
    limit: -1
  })).catch(() => [])

  return { splits: Array.isArray(result) ? result : [] }
})
