import type { ExpenseCategory, PaymentMethod } from '~/types'

// Map from App (English) to Directus (Spanish)
export const CATEGORY_TO_DIRECTUS: Record<ExpenseCategory, string> = {
  food: 'comida',
  transport: 'transporte',
  accommodation: 'alojamiento',
  entertainment: 'entradas',
  shopping: 'compras',
  other: 'otros'
}

// Map from Directus (Spanish) to App (English)
export const DIRECTUS_TO_CATEGORY: Record<string, ExpenseCategory> = Object.entries(CATEGORY_TO_DIRECTUS).reduce(
  (acc, [key, value]) => {
    acc[value] = key as ExpenseCategory
    return acc
  },
  {} as Record<string, ExpenseCategory>
)

// Map from App (English) to Directus (Spanish)
export const PAYMENT_TO_DIRECTUS: Record<PaymentMethod, string> = {
  cash: 'efectivo', // Assuming 'efectivo' based on standard Spanish, user mentioned 'ejectivo' which likely is a typo
  card: 'tarjeta',
  ic: 'ic'
}

// Map from Directus (Spanish) to App (English)
export const DIRECTUS_TO_PAYMENT: Record<string, PaymentMethod> = Object.entries(PAYMENT_TO_DIRECTUS).reduce(
  (acc, [key, value]) => {
    acc[value] = key as PaymentMethod
    return acc
  },
  {} as Record<string, PaymentMethod>
)

// Fallback for payment method if Directus has unexpected value (like 'ejectivo')
export function getPaymentMethodFromDirectus(value: string): PaymentMethod {
  if (value === 'ejectivo') return 'cash' // Handle user typo just in case
  return DIRECTUS_TO_PAYMENT[value] || 'cash'
}

// Fallback for category if Directus has unexpected value
export function getCategoryFromDirectus(value: string): ExpenseCategory {
  return DIRECTUS_TO_CATEGORY[value] || 'other'
}
