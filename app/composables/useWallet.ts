import { readItems, createItem, deleteItem } from '@directus/sdk'
import { useTripExpenses } from './useTripExpenses'
import { useTripOrganization } from './useTripOrganization'

export interface CambioMoneda {
  id: number
  viaje_id: number
  fecha: string
  origen_eur: number
  destino_jpy: number
  tasa_cambio?: number
  lugar?: string
  destino_fondo: 'efectivo' | 'tarjeta' | 'suica'
}

export const useWallet = () => {
  const { getAuthenticatedClient } = useDirectus()
  
  // Dependencias para calcular totales
  const { expenses: dailyExpenses } = useTripExpenses()
  const { vuelos, alojamientos, transportes, actividades, seguros } = useTripOrganization()

  // State
  const cambios = useState<CambioMoneda[]>('wallet-cambios', () => [])
  const loading = useState<boolean>('wallet-loading', () => false)

  // --- Fetch ---
  const fetchCambios = async (tripId: string) => {
    loading.value = true
    try {
      const client = await getAuthenticatedClient()
      const result = await client.request(readItems('cambios_moneda', { 
        filter: { viaje_id: { _eq: tripId } },
        sort: ['-fecha']
      }))
      cambios.value = result as CambioMoneda[]
    } catch (e) {
      console.error('Error fetching cambios:', e)
    } finally {
      loading.value = false
    }
  }

  // --- Actions ---
  const createCambio = async (item: Omit<CambioMoneda, 'id'>) => {
    try {
      const client = await getAuthenticatedClient()
      // Auto-calc rate if missing
      if (!item.tasa_cambio && item.origen_eur > 0) {
        item.tasa_cambio = item.destino_jpy / item.origen_eur
      }
      
      const res = await client.request(createItem('cambios_moneda', item))
      cambios.value.unshift(res as CambioMoneda)
      return res
    } catch (e) {
      console.error('Error creating cambio:', e)
      throw e
    }
  }

  const deleteCambio = async (id: number) => {
    try {
      const client = await getAuthenticatedClient()
      await client.request(deleteItem('cambios_moneda', id))
      cambios.value = cambios.value.filter(c => c.id !== id)
    } catch (e) {
      console.error('Error deleting cambio:', e)
      throw e
    }
  }

  // --- Computed Balances ---

  // 1. Total Euros Invertidos (Cambios + Pagos directos en EUR)
  const totalInvestedEUR = computed(() => {
    let total = 0
    // Dinero cambiado
    total += cambios.value.reduce((acc, c) => acc + Number(c.origen_eur || 0), 0)
    
    // Pagos logísticos en EUR
    const sumEur = (items: any[]) => items.reduce((acc, i) => acc + (i.moneda === 'EUR' ? Number(i.precio || 0) : 0), 0)
    
    total += sumEur(vuelos.value)
    total += sumEur(alojamientos.value)
    total += sumEur(transportes.value)
    total += sumEur(actividades.value)
    total += sumEur(seguros.value)
    
    return total
  })

  // 2. Total Yenes Adquiridos (Entradas de dinero)
  const totalJPYAcquired = computed(() => {
    return cambios.value.reduce((acc, c) => acc + Number(c.destino_jpy || 0), 0)
  })

  // 3. Total Yenes Gastados (Salidas)
  const totalJPYSpent = computed(() => {
    let total = 0
    
    // Gastos diarios (Asumimos son JPY por defecto)
    total += dailyExpenses.value.reduce((acc, e) => acc + Number(e.monto || 0), 0)

    // Pagos logísticos en JPY
    const sumJpy = (items: any[]) => items.reduce((acc, i) => acc + (i.moneda === 'JPY' ? Number(i.precio || 0) : 0), 0)
    
    total += sumJpy(vuelos.value)
    total += sumJpy(alojamientos.value)
    total += sumJpy(transportes.value)
    total += sumJpy(actividades.value)
    total += sumJpy(seguros.value)

    return total
  })

  // 4. Balance Actual Yenes
  const currentJPYBalance = computed(() => {
    return totalJPYAcquired.value - totalJPYSpent.value
  })

  return {
    cambios,
    loading,
    fetchCambios,
    createCambio,
    deleteCambio,
    totalInvestedEUR,
    totalJPYAcquired,
    totalJPYSpent,
    currentJPYBalance
  }
}
