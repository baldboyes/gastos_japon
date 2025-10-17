/**
 * Composable for managing app settings with localStorage persistence
 */

export type Currency = 'JPY' | 'CNY' | 'KRW' | 'EUR' | 'USD' | 'GBP'

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

const STORAGE_KEY = 'app-settings'

export interface AppSettings {
  currency: Currency | null
}

/**
 * Composable for settings management
 */
export function useSettings() {
  const settings = ref<AppSettings>({ currency: null })

  /**
   * Load settings from localStorage
   */
  function loadSettings(): void {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as AppSettings
          settings.value = parsed
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }

  /**
   * Save settings to localStorage
   */
  function saveSettings(): void {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
      } catch (error) {
        console.error('Error saving settings:', error)
      }
    }
  }

  /**
   * Update currency setting
   */
  function setCurrency(currency: Currency): void {
    settings.value.currency = currency
    saveSettings()
  }

  /**
   * Get current currency info
   */
  function getCurrencyInfo(): CurrencyInfo | null {
    if (!settings.value.currency) return null
    return CURRENCIES.find(c => c.code === settings.value.currency) || null
  }

  // Auto-load on mount
  onMounted(() => {
    loadSettings()
  })

  return {
    // State
    settings: readonly(settings),

    // Methods
    setCurrency,
    getCurrencyInfo,
    loadSettings,
    saveSettings
  }
}
