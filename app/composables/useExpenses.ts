/**
 * Composable for managing expenses with localStorage persistence
 */

import type { AppData, Budget, Expense, ExpenseCategory } from '~/types'
import { getDateString, getStartOfDay, getEndOfDay, sortByTimestamp } from '~/utils/dates'

const STORAGE_KEY = 'gastos-japon'

/**
 * Generate a simple UUID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Main composable for expense management
 */
export function useExpenses() {
  // Use Nuxt's useState for global reactive state
  const expenses = useState<Expense[]>('expenses', () => [])
  const budget = useState<Budget>('budget', () => ({
    dailyLimit: 0,
    startDate: new Date().toISOString(),
    currency: null
  }))

  /**
   * Migrate old settings currency to budget
   */
  function migrateCurrencyToBudget(budgetData: Budget): Budget {
    // Check if budget already has currency
    if (budgetData.currency) {
      return budgetData
    }

    // Try to load from old settings storage
    if (import.meta.client) {
      try {
        const oldSettings = localStorage.getItem('app-settings')
        if (oldSettings) {
          const parsed = JSON.parse(oldSettings)
          if (parsed.currency) {
            return {
              ...budgetData,
              currency: parsed.currency
            }
          }
        }
      } catch (error) {
        console.error('Error migrating currency:', error)
      }
    }

    return {
      ...budgetData,
      currency: null
    }
  }

  /**
   * Migrate old location format to new format with coordinates
   */
  function migrateLocationData(expenses: Expense[]): Expense[] {
    return expenses.map(expense => {
      // Check if location has old format (direct lat/lng)
      const location = expense.location as any

      if (location && typeof location.lat === 'number' && typeof location.lng === 'number' && !location.coordinates) {
        // Old format detected - migrate to new format
        return {
          ...expense,
          location: {
            coordinates: {
              lat: location.lat,
              lng: location.lng
            },
            city: location.city || '',
            prefecture: location.prefecture || ''
          }
        }
      }

      // Already in new format or needs initialization
      if (!location.coordinates) {
        return {
          ...expense,
          location: {
            coordinates: {
              lat: 0,
              lng: 0
            },
            city: location.city || '',
            prefecture: location.prefecture || ''
          }
        }
      }

      return expense
    })
  }

  /**
   * Load data from localStorage
   */
  function loadFromStorage(): void {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const data: AppData = JSON.parse(stored)
          // Migrate old data format to new format
          expenses.value = migrateLocationData(data.expenses || [])
          budget.value = migrateCurrencyToBudget(data.budget || budget.value)

          // Save migrated data back to storage
          saveToStorage()
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
      }
    }
  }

  /**
   * Save data to localStorage
   */
  function saveToStorage(): void {
    if (import.meta.client) {
      try {
        const data: AppData = {
          budget: budget.value,
          expenses: expenses.value
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }
  }

  /**
   * Add a new expense
   */
  function addExpense(expense: Omit<Expense, 'id'>): Expense {
    const newExpense: Expense = {
      ...expense,
      id: generateId()
    }
    expenses.value.push(newExpense)
    saveToStorage()
    return newExpense
  }

  /**
   * Update an existing expense
   */
  function updateExpense(id: string, updates: Partial<Expense>): boolean {
    const index = expenses.value.findIndex(e => e.id === id)
    if (index === -1) return false

    const currentExpense = expenses.value[index]!
    expenses.value[index] = {
      ...currentExpense,
      ...updates,
      id, // Preserve original ID
      timestamp: updates.timestamp ?? currentExpense.timestamp,
      placeName: updates.placeName ?? currentExpense.placeName,
      amount: updates.amount ?? currentExpense.amount,
      category: updates.category ?? currentExpense.category,
      location: updates.location ?? currentExpense.location,
      paymentMethod: updates.paymentMethod ?? currentExpense.paymentMethod
    } as Expense
    saveToStorage()
    return true
  }

  /**
   * Delete an expense
   */
  function deleteExpense(id: string): boolean {
    const index = expenses.value.findIndex(e => e.id === id)
    if (index === -1) return false

    expenses.value.splice(index, 1)
    saveToStorage()
    return true
  }

  /**
   * Get a single expense by ID
   */
  function getExpense(id: string): Expense | undefined {
    return expenses.value.find(e => e.id === id)
  }

  /**
   * Get expenses for a specific date
   */
  function getExpensesByDate(date: string | Date): Expense[] {
    const dateStr = getDateString(date)
    return expenses.value.filter(expense => {
      const expenseDateStr = getDateString(expense.timestamp)
      return expenseDateStr === dateStr
    })
  }

  /**
   * Get expenses in a date range
   */
  function getExpensesInRange(start: string | Date, end: string | Date): Expense[] {
    const startTime = new Date(getStartOfDay(start)).getTime()
    const endTime = new Date(getEndOfDay(end)).getTime()

    return expenses.value.filter(expense => {
      const expenseTime = new Date(expense.timestamp).getTime()
      return expenseTime >= startTime && expenseTime <= endTime
    })
  }

  /**
   * Get today's expenses
   */
  function getTodayExpenses(): Expense[] {
    return getExpensesByDate(new Date())
  }

  /**
   * Get total amount spent across all expenses
   */
  function getTotalSpent(): number {
    return expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  }

  /**
   * Get total amount spent today
   */
  function getTodaySpent(): number {
    const todayExpenses = getTodayExpenses()
    return todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  /**
   * Get remaining budget for today
   */
  function getTodayRemaining(): number {
    return budget.value.dailyLimit - getTodaySpent()
  }

  /**
   * Get average daily spending
   */
  function getAverageDailySpending(): number {
    if (expenses.value.length === 0) return 0

    const startDate = new Date(budget.value.startDate)
    const today = new Date()
    const daysElapsed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

    return getTotalSpent() / daysElapsed
  }

  /**
   * Get expenses grouped by category with totals
   */
  function getExpensesByCategory(): Record<string, number> {
    return expenses.value.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Get expenses grouped by location (prefecture)
   */
  function getExpensesByPrefecture(): Record<string, number> {
    return expenses.value.reduce((acc, expense) => {
      const prefecture = expense.location.prefecture
      acc[prefecture] = (acc[prefecture] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Get expenses grouped by location (city)
   */
  function getExpensesByCity(): Record<string, number> {
    return expenses.value.reduce((acc, expense) => {
      const city = expense.location.city
      acc[city] = (acc[city] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Get expenses by payment method
   */
  function getExpensesByPaymentMethod(): Record<string, number> {
    return expenses.value.reduce((acc, expense) => {
      acc[expense.paymentMethod] = (acc[expense.paymentMethod] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Get all expenses sorted by timestamp (newest first)
   */
  function getSortedExpenses(): Expense[] {
    return sortByTimestamp(expenses.value)
  }

  /**
   * Filter expenses by category
   */
  function filterByCategory(category: ExpenseCategory): Expense[] {
    return expenses.value.filter(e => e.category === category)
  }

  /**
   * Search expenses by place name
   */
  function searchByPlace(query: string): Expense[] {
    const lowerQuery = query.toLowerCase()
    return expenses.value.filter(e =>
      e.placeName.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Update budget settings
   */
  function updateBudget(newBudget: Partial<Budget>): void {
    budget.value = {
      ...budget.value,
      ...newBudget
    }
    saveToStorage()
  }

  /**
   * Export all data as JSON string
   */
  function exportData(): string {
    const data: AppData = {
      budget: budget.value,
      expenses: expenses.value
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import data from JSON string
   */
  function importData(json: string): boolean {
    try {
      const data: AppData = JSON.parse(json)
      if (data.budget) budget.value = data.budget
      if (data.expenses) expenses.value = data.expenses
      saveToStorage()
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  function clearAllData(): void {
    expenses.value = []
    budget.value = {
      dailyLimit: 0,
      startDate: new Date().toISOString(),
      currency: budget.value.currency // Preserve currency when clearing
    }
    saveToStorage()
  }

  /**
   * Get statistics summary
   */
  function getStats() {
    return {
      totalSpent: getTotalSpent(),
      todaySpent: getTodaySpent(),
      todayRemaining: getTodayRemaining(),
      averageDaily: getAverageDailySpending(),
      totalExpenses: expenses.value.length,
      byCategory: getExpensesByCategory(),
      byPrefecture: getExpensesByPrefecture(),
      byCity: getExpensesByCity(),
      byPaymentMethod: getExpensesByPaymentMethod()
    }
  }

  // Auto-load on mount
  onMounted(() => {
    loadFromStorage()
  })

  return {
    // State
    expenses,
    budget,

    // CRUD operations
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,

    // Queries
    getExpensesByDate,
    getExpensesInRange,
    getTodayExpenses,
    getSortedExpenses,
    filterByCategory,
    searchByPlace,

    // Calculations
    getTotalSpent,
    getTodaySpent,
    getTodayRemaining,
    getAverageDailySpending,
    getExpensesByCategory,
    getExpensesByPrefecture,
    getExpensesByCity,
    getExpensesByPaymentMethod,
    getStats,

    // Budget management
    updateBudget,

    // Persistence
    loadFromStorage,
    saveToStorage,
    exportData,
    importData,
    clearAllData
  }
}
