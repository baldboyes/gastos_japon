import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'

export interface TripExpense {
  id: number
  fecha: string
  concepto: string
  monto: number
  categoria: string
  descripcion: string
  metodo_pago: string
  es_compartido: boolean
  viaje_id: number
  ubicacion_lat?: number
  ubicacion_lng?: number
  ciudad?: string
  prefectura?: string
}

export const useTripExpenses = () => {
  const { getAuthenticatedClient } = useDirectus()
  const expenses = useState<TripExpense[]>('trip-expenses', () => [])
  const loading = useState<boolean>('trip-expenses-loading', () => false)
  const error = useState<string | null>('trip-expenses-error', () => null)

  const fetchExpenses = async (tripId: string) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(readItems('gastos', {
        filter: { viaje_id: { _eq: tripId } },
        sort: ['-fecha']
      }))
      
      if (Array.isArray(result)) {
        expenses.value = result as TripExpense[]
      } else {
        expenses.value = []
      }
    } catch (e: any) {
      console.error('Error fetching expenses:', e)
      error.value = e.message || 'Error al cargar los gastos'
    } finally {
      loading.value = false
    }
  }

  const createExpense = async (expense: Omit<TripExpense, 'id'>) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(createItem('gastos', expense))
      
      const newExpense = result as TripExpense
      expenses.value.unshift(newExpense)
      return newExpense
    } catch (e: any) {
      console.error('Error creating expense:', e)
      error.value = e.message || 'Error al crear el gasto'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateExpense = async (id: number, updates: Partial<TripExpense>) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(updateItem('gastos', id, updates))
      
      const index = expenses.value.findIndex(e => e.id === id)
      if (index !== -1) {
        expenses.value[index] = result as TripExpense
      }
      return result
    } catch (e: any) {
      console.error('Error updating expense:', e)
      error.value = e.message || 'Error al actualizar el gasto'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteExpense = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const client = await getAuthenticatedClient()
      await client.request(deleteItem('gastos', id))
      expenses.value = expenses.value.filter(e => e.id !== id)
    } catch (e: any) {
      console.error('Error deleting expense:', e)
      error.value = e.message || 'Error al eliminar el gasto'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  }
}
