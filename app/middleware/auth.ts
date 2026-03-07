export default defineNuxtRouteMiddleware((to) => {
  const { userId } = useAuth()

  if (/\/trips\/\d+\/join/.test(to.path)) {
    return
  }

  if (!userId.value) {
    return navigateTo('/')
  }
})
