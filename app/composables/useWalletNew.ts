import { readItems, createItem, deleteItem } from '@directus/sdk'
import { useExpensesNew } from './useExpensesNew'
import { useTripOrganizationNew } from './useTripOrganizationNew'
import type { CurrencyExchange } from '~/types/directus'

export const useWalletNew = () => {
  const { getClient } = useDirectusRepo()
  
  // Dependencies
  const { expenses: dailyExpenses } = useExpensesNew()
  const { flights, accommodations, transports, activities, insurances } = useTripOrganizationNew()

  // State
  const cambios = useState<CurrencyExchange[]>('wallet-new-cambios', () => [])
  const loading = useState<boolean>('wallet-new-loading', () => false)

  // --- Fetch ---
  const fetchCambios = async (tripId: number) => {
    loading.value = true
    try {
      const client = await getClient()
      const result = await client.request(readItems('currency_exchanges', { 
        filter: { trip_id: { _eq: tripId } },
        sort: ['-date']
      }))
      cambios.value = result as CurrencyExchange[]
    } catch (e) {
      console.error('Error fetching currency exchanges (new):', e)
    } finally {
      loading.value = false
    }
  }

  // --- Actions ---
  const createCambio = async (item: Omit<CurrencyExchange, 'id' | 'status' | 'user_created' | 'date_created'>) => {
    try {
      const client = await getClient()
      
      // Auto-calc rate if missing
      if (!item.rate && item.amount_from > 0) {
        item.rate = item.amount_to / item.amount_from
      }
      
      const res = await client.request(createItem('currency_exchanges', item as any))
      cambios.value.unshift(res as CurrencyExchange)
      return res
    } catch (e) {
      console.error('Error creating currency exchange (new):', e)
      throw e
    }
  }

  const deleteCambio = async (id: number) => {
    try {
      const client = await getClient()
      await client.request(deleteItem('currency_exchanges', id))
      cambios.value = cambios.value.filter(c => c.id !== id)
    } catch (e) {
      console.error('Error deleting currency exchange (new):', e)
      throw e
    }
  }

  // --- Computed Balances ---

  // 1. Total Invested (assumed EUR based on current app logic)
  // We sum 'amount_from' from exchanges where currency_from is EUR
  const totalInvestedEUR = computed(() => {
    let total = 0
    // Money Exchanged (Source side)
    total += cambios.value.reduce((acc, c) => {
        // Assume if currency_from is missing it's EUR, or check specific currency
        if (c.currency_from === 'EUR' || !c.currency_from) {
            return acc + Number(c.amount_from || 0)
        }
        return acc
    }, 0)
    
    // Logistic payments in EUR
    const sumEur = (items: any[]) => items.reduce((acc, i) => acc + (i.currency === 'EUR' ? Number(i.price || 0) : 0), 0)
    
    total += sumEur(flights.value)
    total += sumEur(accommodations.value)
    total += sumEur(transports.value)
    total += sumEur(activities.value)
    total += sumEur(insurances.value)
    
    return total
  })

  // 2. Total Acquired (assumed JPY)
  const totalJPYAcquired = computed(() => {
    return cambios.value.reduce((acc, c) => {
        if (c.currency_to === 'JPY' || !c.currency_to) {
            return acc + Number(c.amount_to || 0)
        }
        return acc
    }, 0)
  })

  // 3. Total Spent (assumed JPY for daily expenses)
  const totalJPYSpent = computed(() => {
    let total = 0
    
    // Daily expenses (AppExpense has amount, assumed JPY or converting?)
    // The current app assumes daily expenses are in JPY (amount field)
    total += dailyExpenses.value.reduce((acc, e) => acc + Number(e.amount || 0), 0)

    // Logistic payments in JPY
    const sumJpy = (items: any[]) => items.reduce((acc, i) => acc + (i.currency === 'JPY' ? Number(i.price || 0) : 0), 0)
    
    total += sumJpy(flights.value)
    total += sumJpy(accommodations.value)
    total += sumJpy(transports.value)
    total += sumJpy(activities.value)
    total += sumJpy(insurances.value)

    return total
  })

  // 4. Current Balance
  const currentJPYBalance = computed(() => {
    return totalJPYAcquired.value - totalJPYSpent.value
  })

  // 5. Payment Breakdown
  const paymentBreakdown = computed(() => {
    const breakdown = {
      eur: { paid: 0, pending: 0 },
      jpy: { paid: 0, pending: 0 }
    }

    const processItem = (item: any) => {
      const price = Number(item.price || 0)
      const currency = item.currency as 'EUR' | 'JPY'
      // payment_status: 'paid', 'pending', etc.
      const isPaid = item.payment_status === 'paid'

      if (currency === 'EUR') {
        if (isPaid) breakdown.eur.paid += price
        else breakdown.eur.pending += price
      } else {
        if (isPaid) breakdown.jpy.paid += price
        else breakdown.jpy.pending += price
      }
    }

    flights.value.forEach(processItem)
    accommodations.value.forEach(processItem)
    transports.value.forEach(processItem)
    activities.value.forEach(processItem)
    insurances.value.forEach(processItem)

    return breakdown
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
    currentJPYBalance,
    paymentBreakdown
  }
}
