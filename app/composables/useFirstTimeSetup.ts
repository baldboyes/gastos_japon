/**
 * Composable to detect first-time users and ensure initial setup
 */

const SETUP_COMPLETE_KEY = 'setup-complete'

export function useFirstTimeSetup() {
  /**
   * Check if user has completed initial setup
   */
  function isSetupComplete(): boolean {
    if (!import.meta.client) return true

    try {
      // Check if setup flag exists
      const setupFlag = localStorage.getItem(SETUP_COMPLETE_KEY)
      if (setupFlag === 'true') return true

      // Check if currency is configured
      const settings = localStorage.getItem('app-settings')
      let hasCurrency = false

      if (settings) {
        const parsed = JSON.parse(settings)
        hasCurrency = parsed.currency !== null && parsed.currency !== undefined
      }

      // Check if budget has been configured
      const data = localStorage.getItem('gastos-japon')
      let hasBudget = false

      if (data) {
        const parsed = JSON.parse(data)
        // Consider setup complete if budget has been explicitly set (> 0)
        hasBudget = parsed.budget && parsed.budget.dailyLimit > 0
      }

      // Setup is complete only if both currency AND budget are configured
      return hasCurrency && hasBudget
    } catch (error) {
      console.error('Error checking setup status:', error)
      return false
    }
  }

  /**
   * Mark setup as complete
   */
  function markSetupComplete(): void {
    if (import.meta.client) {
      try {
        localStorage.setItem(SETUP_COMPLETE_KEY, 'true')
      } catch (error) {
        console.error('Error marking setup complete:', error)
      }
    }
  }

  /**
   * Reset setup status (for testing)
   */
  function resetSetup(): void {
    if (import.meta.client) {
      try {
        localStorage.removeItem(SETUP_COMPLETE_KEY)
      } catch (error) {
        console.error('Error resetting setup:', error)
      }
    }
  }

  /**
   * Check if should redirect to settings
   * Returns true if user should be redirected
   */
  function shouldRedirectToSettings(currentPath: string): boolean {
    // Don't redirect if already on settings page
    if (currentPath === '/settings') return false

    // Redirect if setup is not complete
    return !isSetupComplete()
  }

  return {
    isSetupComplete,
    markSetupComplete,
    resetSetup,
    shouldRedirectToSettings
  }
}
