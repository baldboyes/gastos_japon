/**
 * Composable for managing app settings
 * Now uses budget.currency instead of separate storage
 */

import type { Currency } from '~/types'

export interface CurrencyInfo {
  code: Currency
  name: string
  symbol: string
  flag: string
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'JPY', name: 'Yen Japonés', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Yuan Chino', symbol: '¥', flag: '🇨🇳' },
  { code: 'KRW', name: 'Won Coreano', symbol: '₩', flag: '🇰🇷' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧' }
]

/**
 * Composable for settings management
 */
export function useSettings() {
  const { budget, updateBudget } = useExpenses()

  const settings = computed(() => ({
    currency: budget.value.currency
  }))

  /**
   * Update currency setting
   */
  function setCurrency(currency: Currency): void {
    updateBudget({ currency })
  }

  /**
   * Get current currency info
   */
  function getCurrencyInfo(): CurrencyInfo | null {
    if (!settings.value.currency) return null
    return CURRENCIES.find(c => c.code === settings.value.currency) || null
  }

  return {
    // State
    settings,

    // Methods
    setCurrency,
    getCurrencyInfo
  }
}
