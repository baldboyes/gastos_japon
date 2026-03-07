import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Trip } from '~/types/directus'

export const useTripsNew = () => {
  const { getClient, directusUserId } = useDirectusRepo()
  const trips = useState<Trip[]>('trips-new', () => [])
  const currentTrip = useState<Trip | null>('current-trip-new', () => null)
  const collaborators = useState<any[]>('trip-collaborators-new', () => [])
  const loading = useState<boolean>('trips-new-loading', () => false)
  const error = useState<string | null>('trips-new-error', () => null)

  const fetchCollaborators = async (tripId: number) => {
    try {
      const result = await $fetch('/api/trips/collaborators', {
        method: 'GET',
        query: { tripId }
      }) as any

      collaborators.value = Array.isArray(result?.collaborators) ? result.collaborators : []
    } catch (e) {
      collaborators.value = []
    }
  }

  const fetchTrips = async () => {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      
      const result = await client.request(readItems('trips', {
        sort: ['-start_date'],
        fields: [
          '*',
          // Assuming user_created and collaborators relations are set up similarly in Directus
          'user_created.first_name',
          'user_created.last_name',
          'user_created.avatar_url'
          // Collaborators expansion might need adjustment depending on how M2M is set up in new schema
        ]
      }))
      
      if (Array.isArray(result)) {
        trips.value = result as Trip[]
      } else {
        trips.value = []
      }

    } catch (e: any) {
      try {
        const res = await $fetch('/api/trips/my') as any
        trips.value = Array.isArray(res?.trips) ? res.trips : []
      } catch (fallbackError: any) {
        console.error('Error fetching trips (new):', e)
        error.value = e.message || 'Error al cargar los viajes'
      }
    } finally {
      loading.value = false
    }
  }

  const getTrip = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      const result = await client.request(readItem('trips', id, {
          fields: ['*', 'expenses.*', 'activities.*', 'accommodations.*', 'flights.*', 'transports.*', 'tasks.*']
      }))
      currentTrip.value = result as Trip
      await fetchCollaborators(id)
      return result
    } catch (e: any) {
      try {
        const res = await $fetch('/api/trips/item', { method: 'GET', query: { tripId: id } }) as any
        currentTrip.value = (res?.trip || null) as any
        await fetchCollaborators(id)
        return res?.trip
      } catch (fallbackError: any) {
        console.error('Error fetching trip (new):', e)
        error.value = e.message || 'Error al cargar el viaje'
        throw e
      }
    } finally {
      loading.value = false
    }
  }

  const createTrip = async (tripData: Partial<Trip>) => {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      
      const result = await client.request(createItem('trips', tripData as any))
      
      if (result) {
        const newTrip = result as Trip
        // Association logic with Clerk user ID if needed, typically handled by Directus user_created automatically if token is present
        trips.value.unshift(newTrip)
        return result
      }
    } catch (e: any) {
      console.error('Error creating trip (new):', e)
      error.value = e.message || 'Error al crear el viaje'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateTrip = async (id: number, updates: Partial<Trip>) => {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      const result = await client.request(updateItem('trips', id, updates as any))
      
      const index = trips.value.findIndex(t => t.id === id)
      if (index !== -1) {
        trips.value[index] = result as Trip
      }
      if (currentTrip.value?.id === id) {
        currentTrip.value = result as Trip
      }
      return result
    } catch (e: any) {
      console.error('Error updating trip (new):', e)
      error.value = e.message || 'Error al actualizar el viaje'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteTrip = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const client = await getClient()
      await client.request(deleteItem('trips', id))
      trips.value = trips.value.filter(t => t.id !== id)
      if (currentTrip.value?.id === id) {
        currentTrip.value = null
      }
    } catch (e: any) {
      console.error('Error deleting trip (new):', e)
      error.value = e.message || 'Error al eliminar el viaje'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    trips,
    currentTrip,
    collaborators,
    loading,
    error,
    fetchTrips,
    getTrip,
    fetchCollaborators,
    createTrip,
    updateTrip,
    deleteTrip
  }
}
