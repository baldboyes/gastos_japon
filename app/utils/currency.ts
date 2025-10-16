/**
 * Currency formatting utilities for Japanese Yen
 */

/**
 * Format amount as Japanese Yen
 * @param amount - Amount in yenes
 * @returns Formatted string (e.g., "¥1,200")
 */
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

/**
 * Parse yen string to number
 * @param value - String value (e.g., "¥1,200" or "1200")
 * @returns Numeric value
 */
export function parseYen(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Format amount with compact notation (e.g., 1.2K, 10K)
 * @param amount - Amount in yenes
 * @returns Compact formatted string
 */
export function formatYenCompact(amount: number): string {
  if (amount >= 1000000) {
    return `¥${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `¥${(amount / 1000).toFixed(1)}K`
  }
  return formatYen(amount)
}

/**
 * Calculate percentage of budget used
 * @param spent - Amount spent
 * @param budget - Budget limit
 * @returns Percentage (0-100+)
 */
export function calculateBudgetPercentage(spent: number, budget: number): number {
  if (budget === 0) return 0
  return Math.round((spent / budget) * 100)
}

/**
 * Get budget status color class
 * @param percentage - Budget usage percentage
 * @returns Tailwind color class
 */
export function getBudgetStatusColor(percentage: number): string {
  if (percentage <= 70) return 'text-green-600'
  if (percentage <= 90) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get budget status background color class
 * @param percentage - Budget usage percentage
 * @returns Tailwind background color class
 */
export function getBudgetStatusBgColor(percentage: number): string {
  if (percentage <= 70) return 'bg-green-500'
  if (percentage <= 90) return 'bg-yellow-500'
  return 'bg-red-500'
}
