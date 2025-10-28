/**
 * Date formatting and manipulation utilities
 */

import type { Expense } from '~/types'

/**
 * Format date in readable format (e.g., "18 May 2025")
 * Handles both "YYYY-MM-DD HH:MM" format and ISO format
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  if (typeof date === 'string') {
    // Check if it's our custom format "YYYY-MM-DD HH:MM"
    if (date.includes(' ') && !date.includes('T')) {
      const datePart = date.split(' ')[0]
      // Parse manually to avoid timezone conversion
      const [year, month, day] = datePart!.split('-').map(Number)
      const d = new Date(year!, month! - 1, day)
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
    // Handle ISO format or other string formats
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  // Handle Date object
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Format time in readable format (e.g., "14:30")
 * Handles both "YYYY-MM-DD HH:MM" format and ISO format
 * @param date - Date string or Date object
 * @returns Formatted time string
 */
export function formatTime(date: string | Date): string {
  if (typeof date === 'string') {
    // Check if it's our custom format "YYYY-MM-DD HH:MM"
    if (date.includes(' ') && !date.includes('T')) {
      const timePart = date.split(' ')[1]
      return timePart || '00:00'
    }
    // Handle ISO format or other string formats
    const d = new Date(date)
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  // Handle Date object
  return date.toLocaleTimeString('es-ES', {
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
 * Handles both "YYYY-MM-DD HH:MM" format and ISO format
 * @param date - Date string or Date object
 * @returns True if date is today
 */
export function isToday(date: string | Date): boolean {
  const today = getCurrentDateString()

  if (typeof date === 'string') {
    // Check if it's our custom format "YYYY-MM-DD HH:MM"
    if (date.includes(' ') && !date.includes('T')) {
      const datePart = date.split(' ')[0]
      return datePart === today
    }
    // Handle ISO format or other string formats
    const d = new Date(date)
    return getDateString(d) === today
  }
  // Handle Date object
  return getDateString(date) === today
}

/**
 * Check if date is yesterday
 * Handles both "YYYY-MM-DD HH:MM" format and ISO format
 * @param date - Date string or Date object
 * @returns True if date is yesterday
 */
export function isYesterday(date: string | Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getDateString(yesterday)

  if (typeof date === 'string') {
    // Check if it's our custom format "YYYY-MM-DD HH:MM"
    if (date.includes(' ') && !date.includes('T')) {
      const datePart = date.split(' ')[0]
      return datePart === yesterdayStr
    }
    // Handle ISO format or other string formats
    const d = new Date(date)
    return getDateString(d) === yesterdayStr
  }
  // Handle Date object
  return getDateString(date) === yesterdayStr
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
 * Get date string in YYYY-MM-DD format from timestamp
 * Handles both "YYYY-MM-DD HH:MM" format and ISO format
 * @param date - Date object or string timestamp
 * @returns Date in YYYY-MM-DD format
 */
export function getDateString(date: string | Date): string {
  if (typeof date === 'string') {
    // Check if it's our custom format "YYYY-MM-DD HH:MM"
    if (date.includes(' ') && !date.includes('T')) {
      return date.split(' ')[0] || date
    }
    // Handle ISO format or other string formats
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  // Handle Date object
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get current date string in YYYY-MM-DD format (local timezone)
 * This ensures the date is correct for the user's current timezone
 * @returns Current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get current time string in HH:MM format (local timezone)
 * @returns Current time in HH:MM format
 */
export function getCurrentTimeString(): string {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Get time string from a timestamp in HH:MM format
 * Handles both "YYYY-MM-DD HH:MM" format and ISO format
 * @param date - Date object or string timestamp
 * @returns Time in HH:MM format
 */
export function getTimeString(date: string | Date): string {
  if (typeof date === 'string') {
    // Check if it's our custom format "YYYY-MM-DD HH:MM"
    if (date.includes(' ') && !date.includes('T')) {
      const timePart = date.split(' ')[1]
      return timePart || '00:00'
    }
    // Handle ISO format or other string formats
    const d = new Date(date)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  // Handle Date object
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Get start of day timestamp (local timezone)
 * @param date - Date object or string
 * @returns Timestamp string in our format "YYYY-MM-DD 00:00"
 */
export function getStartOfDay(date: string | Date): string {
  const dateStr = getDateString(date)
  return `${dateStr} 00:00`
}

/**
 * Get end of day timestamp (local timezone)
 * @param date - Date object or string
 * @returns Timestamp string in our format "YYYY-MM-DD 23:59"
 */
export function getEndOfDay(date: string | Date): string {
  const dateStr = getDateString(date)
  return `${dateStr} 23:59`
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
 * Handles both "YYYY-MM-DD HH:MM" format and ISO format
 * @param expenses - Array of expenses
 * @returns Sorted array
 */
export function sortByTimestamp(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    // Convert timestamps to comparable format
    const timeA = a.timestamp.includes(' ') && !a.timestamp.includes('T')
      ? a.timestamp.replace(' ', 'T') + ':00' // Convert to ISO-like format for comparison
      : a.timestamp
    const timeB = b.timestamp.includes(' ') && !b.timestamp.includes('T')
      ? b.timestamp.replace(' ', 'T') + ':00'
      : b.timestamp

    return new Date(timeB).getTime() - new Date(timeA).getTime()
  })
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
