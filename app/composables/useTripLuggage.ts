import type { Suitcase, SuitcaseItem, SuitcaseType } from '~/types/directus'

export const useTripLuggage = () => {
  const suitcases = useState<Suitcase[]>('trip-luggage-suitcases', () => [])
  const loading = useState<boolean>('trip-luggage-loading', () => false)
  const error = useState<string | null>('trip-luggage-error', () => null)

  const fetchSuitcases = async (tripId: number) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch('/api/trips/luggage', {
        method: 'GET',
        query: { tripId }
      }) as any

      suitcases.value = Array.isArray(res?.suitcases) ? (res.suitcases as Suitcase[]) : []
      return suitcases.value
    } catch (e: any) {
      error.value = e?.message || String(e)
      suitcases.value = []
      throw e
    } finally {
      loading.value = false
    }
  }

  const createSuitcase = async (tripId: number, payload: { name: string, type: SuitcaseType }) => {
    const res = await $fetch('/api/trips/luggage/suitcases', {
      method: 'POST',
      body: { tripId, name: payload.name, type: payload.type }
    }) as any
    return res?.suitcase
  }

  const deleteSuitcaseById = async (tripId: number, id: number) => {
    await $fetch('/api/trips/luggage/suitcases', {
      method: 'DELETE',
      body: { tripId, id }
    })
  }

  const createSuitcaseItem = async (payload: { tripId: number, suitcaseId: number, name: string, quantity: number }) => {
    const res = await $fetch('/api/trips/luggage/items', {
      method: 'POST',
      body: {
        tripId: payload.tripId,
        suitcaseId: payload.suitcaseId,
        name: payload.name,
        quantity: payload.quantity
      }
    }) as any
    return res?.item
  }

  const updateSuitcaseItem = async (payload: { tripId: number, id: number, updates: Partial<Pick<SuitcaseItem, 'name' | 'quantity' | 'packed' | 'sort'>> & { suitcaseId?: number } }) => {
    const res = await $fetch('/api/trips/luggage/items', {
      method: 'PATCH',
      body: { tripId: payload.tripId, id: payload.id, ...payload.updates }
    }) as any
    return res?.item
  }

  const deleteSuitcaseItemById = async (tripId: number, id: number) => {
    await $fetch('/api/trips/luggage/items', {
      method: 'DELETE',
      body: { tripId, id }
    })
  }

  return {
    suitcases,
    loading,
    error,
    fetchSuitcases,
    createSuitcase,
    deleteSuitcaseById,
    createSuitcaseItem,
    updateSuitcaseItem,
    deleteSuitcaseItemById
  }
}
