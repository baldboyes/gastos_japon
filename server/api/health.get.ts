export default defineEventHandler(() => {
  return {
    status: 'ok',
    time: new Date().toISOString(),
    env: {
      clerkPublishableKey: !!process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !!process.env.CLERK_PUBLISHABLE_KEY,
      clerkSecretKey: !!process.env.NUXT_CLERK_SECRET_KEY || !!process.env.CLERK_SECRET_KEY
    }
  }
})
