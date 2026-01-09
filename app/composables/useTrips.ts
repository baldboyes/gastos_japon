import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'

export interface Trip {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string | null
  presupuesto_diario?: number
  moneda?: string
  status?: string
}

export const useTrips = () => {
  const { getAuthenticatedClient, directusUserId } = useDirectus()
  const trips = useState<Trip[]>('trips', () => [])
  const currentTrip = useState<Trip | null>('current-trip', () => null)
  const loading = useState<boolean>('trips-loading', () => false)
  const error = useState<string | null>('trips-error', () => null)

  const travelers = useState<any[]>('travelers', () => [])

  const fetchTravelers = async (tripId: string) => {
    loading.value = true
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(readItems('viajes_usuarios' as any, {
        filter: { viaje_id: { _eq: tripId } },
        fields: ['id', 'rol', 'status', 'directus_user_id.id', 'directus_user_id.first_name', 'directus_user_id.last_name', 'directus_user_id.email', 'directus_user_id.avatar_url']
      }))
      
      travelers.value = result.map((r: any) => ({
        relationId: r.id,
        role: r.rol,
        status: r.status,
        ...r.directus_user_id
      }))
    } catch (e: any) {
      console.error('Error fetching travelers:', e)
      // No lanzamos error global para no bloquear la UI principal
    } finally {
      loading.value = false
    }
  }

  const fetchTrips = async () => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(readItems('viajes', {
        sort: ['-fecha_inicio']
      }))
      
      if (Array.isArray(result)) {
        trips.value = result as Trip[]
      } else {
        trips.value = []
      }
    } catch (e: any) {
      console.error('Error fetching trips:', e)
      error.value = e.message || 'Error al cargar los viajes'
    } finally {
      loading.value = false
    }
  }

  const getTrip = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(readItem('viajes', id))
      currentTrip.value = result as Trip
      return result
    } catch (e: any) {
      console.error('Error fetching trip:', e)
      error.value = e.message || 'Error al cargar el viaje'
      throw e
    } finally {
      loading.value = false
    }
  }

  const createTrip = async (trip: Omit<Trip, 'id' | 'status'>) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      
      const result = await client.request(createItem('viajes', trip, {
        fields: ['id', 'nombre', 'fecha_inicio', 'fecha_fin', 'status', 'presupuesto_diario', 'moneda']
      }))
      
      if (result && typeof result === 'object') {
        const newTrip = result as Trip
        
        if (directusUserId.value) {
            try {
                await $fetch('/api/trips/associate', {
                    method: 'POST',
                    body: {
                        tripId: newTrip.id,
                        userId: directusUserId.value
                    }
                })
            } catch (assocError: any) {
                console.error('Error asociando viaje:', assocError)
            }
        }

        trips.value.unshift(newTrip)
        return result
      } else {
        throw new Error('Respuesta inválida al crear viaje')
      }
    } catch (e: any) {
      console.error('Error creating trip:', e)
      error.value = e.message || 'Error al crear el viaje'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(updateItem('viajes', id, updates))
      
      const index = trips.value.findIndex(t => t.id === id)
      if (index !== -1) {
        trips.value[index] = result as Trip
      }
      if (currentTrip.value?.id === id) {
        currentTrip.value = result as Trip
      }
      return result
    } catch (e: any) {
      console.error('Error updating trip:', e)
      error.value = e.message || 'Error al actualizar el viaje'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteTrip = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      await client.request(deleteItem('viajes', id))
      trips.value = trips.value.filter(t => t.id !== id)
      if (currentTrip.value?.id === id) {
        currentTrip.value = null
      }
    } catch (e: any) {
      console.error('Error deleting trip:', e)
      error.value = e.message || 'Error al eliminar el viaje'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    trips,
    currentTrip,
    loading,
    error,
    fetchTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    fetchTravelers,
    travelers
  }
}
