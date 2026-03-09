import type { ExpenseSplit, TripSettlement } from '~/types/directus'

type SplitInput = {
  trip_user_id: number
  amount: number
  percentage?: number | null
}

export const useSharedExpenses = () => {
  const fetchTripExpenseSplits = async (tripId: number | string) => {
    const res = await $fetch('/api/trips/shared/splits', {
      method: 'GET',
      query: { tripId: Number(tripId) }
    }) as any
    return (Array.isArray(res?.splits) ? res.splits : []) as ExpenseSplit[]
  }

  const fetchExpenseSplits = async (tripId: number | string, expenseId: number | string) => {
    const res = await $fetch('/api/trips/shared/splits', {
      method: 'GET',
      query: { tripId: Number(tripId), expenseId: Number(expenseId) }
    }) as any
    return (Array.isArray(res?.splits) ? res.splits : []) as ExpenseSplit[]
  }

  const deleteExpenseSplits = async (tripId: number | string, expenseId: number | string) => {
    try {
      await $fetch('/api/trips/shared/splits', {
        method: 'DELETE',
        body: { tripId: Number(tripId), expenseId: Number(expenseId) }
      })
    } catch (e: any) {
      if (String(e?.statusMessage || e?.message || '').includes('shared_expense_locked')) throw new Error('shared_expense_locked')
      throw e
    }
  }

  const upsertExpenseSplits = async (tripId: number | string, expenseId: number | string, splits: SplitInput[]) => {
    try {
      await $fetch('/api/trips/shared/splits', {
        method: 'POST',
        body: { tripId: Number(tripId), expenseId: Number(expenseId), splits }
      })
    } catch (e: any) {
      if (String(e?.statusMessage || e?.message || '').includes('shared_expense_locked')) throw new Error('shared_expense_locked')
      throw e
    }
  }

  const fetchTripSettlements = async (tripId: number | string) => {
    const res = await $fetch('/api/trips/shared/settlements', {
      method: 'GET',
      query: { tripId: Number(tripId) }
    }) as any
    return (Array.isArray(res?.settlements) ? res.settlements : []) as TripSettlement[]
  }

  const createTripSettlement = async (tripId: number | string, payload: Omit<TripSettlement, 'id' | 'status' | 'user_created' | 'date_created' | 'trip_id'> & Partial<Pick<TripSettlement, 'settlement_status' | 'settled_at'>>) => {
    const res = await $fetch('/api/trips/shared/settlements', {
      method: 'POST',
      body: {
        tripId: Number(tripId),
        from_trip_user_id: Number(payload.from_trip_user_id as any),
        to_trip_user_id: Number(payload.to_trip_user_id as any),
        amount: Number(payload.amount),
        date: payload.date,
        settlement_status: payload.settlement_status || 'pending',
        settled_at: payload.settled_at || null,
        note: (payload as any).note || null
      }
    }) as any
    return (res?.settlement || null) as TripSettlement
  }

  const updateTripSettlement = async (tripId: number | string, id: number | string, updates: Partial<TripSettlement>) => {
    try {
      const res = await $fetch('/api/trips/shared/settlements', {
        method: 'PATCH',
        body: { tripId: Number(tripId), id: Number(id), updates }
      }) as any
      return (res?.settlement || null) as TripSettlement
    } catch (e: any) {
      if (String(e?.statusMessage || e?.message || '').includes('shared_expense_locked')) throw new Error('shared_expense_locked')
      throw e
    }
  }

  const deleteTripSettlement = async (tripId: number | string, id: number | string) => {
    try {
      await $fetch('/api/trips/shared/settlements', {
        method: 'DELETE',
        body: { tripId: Number(tripId), id: Number(id) }
      })
    } catch (e: any) {
      if (String(e?.statusMessage || e?.message || '').includes('shared_expense_locked')) throw new Error('shared_expense_locked')
      throw e
    }
  }

  return {
    fetchTripExpenseSplits,
    fetchExpenseSplits,
    deleteExpenseSplits,
    upsertExpenseSplits,
    fetchTripSettlements,
    createTripSettlement,
    updateTripSettlement,
    deleteTripSettlement
  }
}
