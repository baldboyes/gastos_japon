import { deleteItem, readItems } from '@directus/sdk'
import { assertTripAccess, createAdminClient, getDirectusUserIdFromEvent } from '../../../utils/directus-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const tripId = Number(body?.tripId)
  const expenseId = Number(body?.expenseId)

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }
  if (!Number.isFinite(expenseId) || expenseId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid expenseId' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const existing = await adminClient.request(readItems('expense_splits', {
    filter: { _and: [{ trip_id: { _eq: tripId } }, { expense_id: { _eq: expenseId } }, { status: { _neq: 'archived' } }] },
    fields: ['id', 'settled'],
    limit: -1
  })).catch(() => []) as any[]

  if (existing.some(s => !!s?.settled)) {
    throw createError({ statusCode: 409, statusMessage: 'shared_expense_locked' })
  }

  for (const s of existing) {
    await adminClient.request(deleteItem('expense_splits', Number(s.id)))
  }

  return { ok: true }
})
