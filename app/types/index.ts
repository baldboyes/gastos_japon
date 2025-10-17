/**
 * Application types for Gastos Japón
 */

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'entertainment' | 'shopping' | 'other'

export type PaymentMethod = 'cash' | 'card' | 'ic'

export interface Location {
  coordinates: {
    lat: number
    lng: number
  }
  city: string
  prefecture: string
}

export interface Expense {
  id: string
  timestamp: string // ISO datetime string
  placeName: string
  amount: number // Amount in yenes
  category: ExpenseCategory
  notes: string
  location: Location
  paymentMethod: PaymentMethod
  shared: boolean
  photo?: string // Optional base64 or URL
}

export type Currency = 'JPY' | 'CNY' | 'KRW' | 'EUR' | 'USD' | 'GBP'

export interface Budget {
  dailyLimit: number // Default: 8000 yenes
  startDate: string // ISO date string - trip start date
  currency: Currency | null // Selected currency
}

export interface AppData {
  budget: Budget
  expenses: Expense[]
}

/**
 * Category metadata for UI display
 */
export interface CategoryInfo {
  key: ExpenseCategory
  label: string
  icon: string
  color: string
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'food', label: 'Comida y Bebida', icon: '🍜', color: 'bg-orange-500' },
  { key: 'transport', label: 'Transporte', icon: '🚇', color: 'bg-blue-500' },
  { key: 'accommodation', label: 'Alojamiento', icon: '🏨', color: 'bg-purple-500' },
  { key: 'entertainment', label: 'Entretenimiento', icon: '🎭', color: 'bg-pink-500' },
  { key: 'shopping', label: 'Compras', icon: '🛍️', color: 'bg-green-500' },
  { key: 'other', label: 'Otros', icon: '📦', color: 'bg-gray-500' },
]

/**
 * Get category info by key
 */
export function getCategoryInfo(category: ExpenseCategory): CategoryInfo {
  return CATEGORIES.find(c => c.key === category) || CATEGORIES[CATEGORIES.length - 1]
}
