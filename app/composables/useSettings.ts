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
// --- América ---
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
  { code: 'CAD', name: 'Dólar Canadiense', symbol: '$', flag: '🇨🇦' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$', flag: '🇲🇽' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', flag: '🇨🇱' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', flag: '🇵🇪' },
  { code: 'UYU', name: 'Peso Uruguayo', symbol: '$', flag: '🇺🇾' },
  { code: 'PYG', name: 'Guaraní Paraguayo', symbol: '₲', flag: '🇵🇾' },
  { code: 'CRC', name: 'Colón Costarricense', symbol: '₡', flag: '🇨🇷' },
  { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', flag: '🇩🇴' },
  { code: 'GTQ', name: 'Quetzal Guatemalteco', symbol: 'Q', flag: '🇬🇹' },
  { code: 'HNL', name: 'Lempira Hondureño', symbol: 'L', flag: '🇭🇳' },
  { code: 'NIO', name: 'Córdoba Nicaragüense', symbol: 'C$', flag: '🇳🇮' },
  { code: 'PAB', name: 'Balboa Panameño', symbol: 'B/.', flag: '🇵🇦' },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs', flag: '🇧🇴' },

  // --- Europa ---
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧' },
  { code: 'CHF', name: 'Franco Suizo', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'SEK', name: 'Corona Sueca', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Corona Noruega', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Corona Danesa', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Zloty Polaco', symbol: 'zł', flag: '🇵🇱' },
  { code: 'TRY', name: 'Lira Turca', symbol: '₺', flag: '🇹🇷' },
  { code: 'RUB', name: 'Rublo Ruso', symbol: '₽', flag: '🇷🇺' },
  { code: 'HUF', name: 'Florín Húngaro', symbol: 'Ft', flag: '🇭🇺' },
  { code: 'CZK', name: 'Corona Checa', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'RON', name: 'Leu Rumano', symbol: 'lei', flag: '🇷🇴' },
  { code: 'BGN', name: 'Lev Búlgaro', symbol: 'лв', flag: '🇧🇬' },
  { code: 'ISK', name: 'Corona Islandesa', symbol: 'kr', flag: '🇮🇸' },
  { code: 'UAH', name: 'Grivna Ucraniana', symbol: '₴', flag: '🇺🇦' },

  // --- Asia y Oceanía ---
  { code: 'JPY', name: 'Yen Japonés', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Yuan Chino', symbol: '¥', flag: '🇨🇳' },
  { code: 'HKD', name: 'Dólar de Hong Kong', symbol: '$', flag: '🇭🇰' },
  { code: 'KRW', name: 'Won Coreano', symbol: '₩', flag: '🇰🇷' },
  { code: 'INR', name: 'Rupia India', symbol: '₹', flag: '🇮🇳' },
  { code: 'SGD', name: 'Dólar de Singapur', symbol: '$', flag: '🇸🇬' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: '$', flag: '🇦🇺' },
  { code: 'NZD', name: 'Dólar Neozelandés', symbol: '$', flag: '🇳🇿' },
  { code: 'THB', name: 'Baht Tailandés', symbol: '฿', flag: '🇹🇭' },
  { code: 'IDR', name: 'Rupia Indonesia', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'MYR', name: 'Ringgit Malayo', symbol: 'RM', flag: '🇲🇾' },
  { code: 'PHP', name: 'Peso Filipino', symbol: '₱', flag: '🇵🇭' },
  { code: 'VND', name: 'Dong Vietnamita', symbol: '₫', flag: '🇻🇳' },
  { code: 'TWD', name: 'Nuevo Dólar Taiwanés', symbol: 'NT$', flag: '🇹🇼' },
  { code: 'PKR', name: 'Rupia Paquistaní', symbol: '₨', flag: '🇵🇰' },
  { code: 'KWD', name: 'Dinar Kuwaití', symbol: 'د.ك', flag: '🇰🇼' },
  { code: 'QAR', name: 'Riyal Catarí', symbol: 'ر.ق', flag: '🇶🇦' },
  { code: 'OMR', name: 'Rial Omaní', symbol: 'ر.ع.', flag: '🇴🇲' },
  { code: 'JOD', name: 'Dinar Jordano', symbol: 'د.ا', flag: '🇯🇴' },
  { code: 'KZT', name: 'Tenge Kazajo', symbol: '₸', flag: '🇰🇿' },
  { code: 'FJD', name: 'Dólar Fiyiano', symbol: 'FJ$', flag: '🇫🇯' },
  { code: 'PGK', name: 'Kina de Papúa Nueva Guinea', symbol: 'K', flag: '🇵🇬' },
  
  // --- África y Medio Oriente ---
  { code: 'ZAR', name: 'Rand Sudafricano', symbol: 'R', flag: '🇿🇦' },
  { code: 'AED', name: 'Dírham de los EAU', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Riyal Saudí', symbol: '﷼', flag: '🇸🇦' },
  { code: 'ILS', name: 'Nuevo Séquel Israelí', symbol: '₪', flag: '🇮🇱' },
  { code: 'EGP', name: 'Libra Egipcia', symbol: '£', flag: '🇪🇬' },
  { code: 'MAD', name: 'Dírham Marroquí', symbol: 'د.م.', flag: '🇲🇦' },
  { code: 'NGN', name: 'Naira Nigeriana', symbol: '₦', flag: '🇳🇬' },
  { code: 'KES', name: 'Chelín Keniano', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'GHS', name: 'Cedi Ghanés', symbol: 'GH₵', flag: '🇬🇭' },
  { code: 'TZS', name: 'Chelín Tanzano', symbol: 'TSh', flag: '🇹🇿' },
  { code: 'ETB', name: 'Birr Etíope', symbol: 'Br', flag: '🇪🇹' },
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
