import { createItem, readItems, updateItem } from '@directus/sdk'
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

  const body = await readBody(event).catch(() => null) as any
  const tripId = Number(body?.tripId)
  const date = String(body?.date || '')
  const content = String(body?.content || '')

  if (!Number.isFinite(tripId) || tripId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tripId' })
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date' })
  }

  const adminClient = createAdminClient()
  const directusUserId = await getDirectusUserIdFromEvent(event, adminClient)
  await assertTripAccess(adminClient, tripId, directusUserId)

  const existing = await adminClient.request(readItems('daily_notes', {
    filter: { trip_id: { _eq: tripId }, date: { _eq: date } },
    fields: ['id'],
    limit: 1
  })).catch(() => []) as any[]

  if (Array.isArray(existing) && existing.length > 0 && existing[0]?.id) {
    const id = Number(existing[0].id)
    await adminClient.request(updateItem('daily_notes', id, { content }))
    return { id, content }
  }

  if (!content) return { id: null as number | null, content: '' }

  const created = await adminClient.request(createItem('daily_notes', {
    trip_id: tripId,
    date,
    content
  }))

  return { id: Number((created as any)?.id), content }
})
