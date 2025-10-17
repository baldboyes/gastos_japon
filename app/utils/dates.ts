/**
 * Date formatting and manipulation utilities
 */

import type { Expense } from '~/types'

/**
 * Format date in readable format (e.g., "18 May 2025")
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Format time in readable format (e.g., "14:30")
 * @param date - Date string or Date object
 * @returns Formatted time string
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date and time together (e.g., "18 May 2025, 14:30")
 * @param date - Date string or Date object
 * @returns Formatted datetime string
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)}, ${formatTime(date)}`
}

/**
 * Format date in short format (e.g., "18/05/25")
 * @param date - Date string or Date object
 * @returns Short formatted date
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

/**
 * Check if date is today
 * @param date - Date string or Date object
 * @returns True if date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * Check if date is yesterday
 * @param date - Date string or Date object
 * @returns True if date is yesterday
 */
export function isYesterday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

/**
 * Get relative day label (Today, Yesterday, or formatted date)
 * @param date - Date string or Date object
 * @returns Relative label
 */
export function getRelativeDayLabel(date: string | Date): string {
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return formatDate(date)
}

/**
 * Get number of days elapsed since start date
 * @param startDate - Start date string (ISO format)
 * @returns Number of days elapsed
 */
export function getDaysElapsed(startDate: string): number {
  const start = new Date(startDate)
  const today = new Date()
  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays) // At least 1 day
}

/**
 * Get date string in YYYY-MM-DD format
 * @param date - Date object or string
 * @returns Date in YYYY-MM-DD format
 */
export function getDateString(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0] || ''
}

/**
 * Get start of day timestamp
 * @param date - Date object or string
 * @returns ISO string at start of day
 */
export function getStartOfDay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Get end of day timestamp
 * @param date - Date object or string
 * @returns ISO string at end of day
 */
export function getEndOfDay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

/**
 * Group expenses by date
 * @param expenses - Array of expenses
 * @returns Record of date string to expenses
 */
export function groupByDate(expenses: Expense[]): Record<string, Expense[]> {
  return expenses.reduce((acc, expense) => {
    const dateKey = getDateString(expense.timestamp)
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(expense)
    return acc
  }, {} as Record<string, Expense[]>)
}

/**
 * Sort expenses by timestamp (newest first)
 * @param expenses - Array of expenses
 * @returns Sorted array
 */
export function sortByTimestamp(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

/**
 * Get ISO string for current time
 * @returns Current timestamp as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Parse ISO date string to Date object
 * @param isoString - ISO date string
 * @returns Date object
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString)
}
