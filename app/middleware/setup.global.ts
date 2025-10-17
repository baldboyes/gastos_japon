/**
 * Global middleware to check if initial setup is complete
 * Redirects to settings page if this is the first time using the app
 */

export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (!import.meta.client) return

  // Don't redirect if already on settings page
  if (to.path === '/settings') return

  const { shouldRedirectToSettings } = useFirstTimeSetup()

  // Check if we should redirect to settings
  if (shouldRedirectToSettings(to.path)) {
    return navigateTo('/settings')
  }
})
