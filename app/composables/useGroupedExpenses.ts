import type { Expense } from '~/types'
import { groupByDate } from '~/utils/dates'

export function useGroupedExpenses(expenses: Ref<Expense[]>, itemsPerPage: number = 10) {
  const currentPage = ref(1)

  // Reset pagination when expenses length changes
  watch(() => expenses.value.length, () => {
    currentPage.value = 1
  })

  const groupedExpenses = computed(() => {
    // Group and sort by date (newest first)
    const grouped = groupByDate(expenses.value)
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

    const result: Record<string, Expense[]> = {}
    sortedDates.forEach(date => {
      result[date] = grouped[date].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    })

    return result
  })

  const visibleGroupedExpenses = computed(() => {
    const allDates = Object.keys(groupedExpenses.value)
    const endIndex = currentPage.value * itemsPerPage
    const visibleDates = allDates.slice(0, endIndex)

    const result: Record<string, Expense[]> = {}
    visibleDates.forEach(date => {
      const expenses = groupedExpenses.value[date]
      if (expenses) {
        result[date] = expenses
      }
    })

    return result
  })

  const hasMoreItems = computed(() => {
    const totalDates = Object.keys(groupedExpenses.value).length
    const visibleDates = Object.keys(visibleGroupedExpenses.value).length
    return visibleDates < totalDates
  })

  const remainingCount = computed(() => {
    const totalDates = Object.keys(groupedExpenses.value).length
    const visibleDates = Object.keys(visibleGroupedExpenses.value).length
    return totalDates - visibleDates
  })

  function loadMore() {
    currentPage.value++
  }

  function getTotalForDate(dateExpenses: Expense[]): number {
    return dateExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  return {
    groupedExpenses,
    visibleGroupedExpenses,
    hasMoreItems,
    remainingCount,
    loadMore,
    getTotalForDate
  }
}
