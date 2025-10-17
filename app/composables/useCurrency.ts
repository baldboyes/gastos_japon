/**
 * Reactive currency composable that uses current settings
 */

import type { Currency } from './useSettings'

/**
 * Composable for currency formatting using current settings
 */
export function useCurrency() {
  const { settings, getCurrencyInfo } = useSettings()

  /**
   * Get current currency symbol (reactive)
   */
  const currencySymbol = computed(() => {
    const info = getCurrencyInfo()
    return info?.symbol || '$'
  })

  /**
   * Get current currency code (reactive)
   */
  const currencyCode = computed(() => settings.value.currency)

  /**
   * Check if currency is configured
   */
  const hasCurrency = computed(() => settings.value.currency !== null)

  /**
   * Format amount with current currency setting (reactive)
   * @param amount - Amount to format
   * @returns Formatted string (e.g., "¥1,200")
   */
  function formatAmount(amount: number): string {
    const symbol = currencySymbol.value
    return `${symbol}${amount.toLocaleString()}`
  }

  /**
   * Format amount with compact notation (e.g., 1.2K, 10K) (reactive)
   * @param amount - Amount to format
   * @returns Compact formatted string
   */
  function formatAmountCompact(amount: number): string {
    const symbol = currencySymbol.value
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`
    }
    return formatAmount(amount)
  }

  /**
   * Parse currency string to number
   * @param value - String value (e.g., "¥1,200" or "1200")
   * @returns Numeric value
   */
  function parseAmount(value: string): number {
    const cleaned = value.replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
  }

  return {
    // Reactive getters
    currencySymbol,
    currencyCode,
    hasCurrency,

    // Methods
    formatAmount,
    formatAmountCompact,
    parseAmount
  }
}
