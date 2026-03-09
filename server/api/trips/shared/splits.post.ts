import { createItem, deleteItem, readItems, readItem } from '@directus/sdk'
import { assertTripAccess, createAdminClient, getDirectusUserIdFromEvent } from '../../../utils/directus-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const tripId = Number(body?.tripId)
  const expenseId = Number(body?.expenseId)
  const splits = Array.isArray(body?.splits) ? body.splits : []

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }
  if (!Number.isFinite(expenseId) || expenseId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid expenseId' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const expense = await adminClient.request(readItem('expenses', expenseId, { fields: ['id', 'trip_id'] })).catch(() => null) as any
  const expenseTripId = typeof expense?.trip_id === 'object' && expense?.trip_id !== null ? expense.trip_id.id : expense?.trip_id
  if (!expense || Number(expenseTripId) !== tripId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

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

  for (const s of splits) {
    const tripUserId = Number(s?.trip_user_id)
    const amount = Math.round(Number(s?.amount))
    const percentage = s?.percentage === null || s?.percentage === undefined ? null : Number(s.percentage)
    if (!Number.isFinite(tripUserId) || tripUserId <= 0) continue
    if (!Number.isFinite(amount) || amount < 0) continue

    await adminClient.request(createItem('expense_splits', {
      status: 'published',
      trip_id: tripId,
      expense_id: expenseId,
      trip_user_id: tripUserId,
      amount,
      percentage,
      settled: false,
      settled_at: null
    } as any))
  }

  return { ok: true }
})
