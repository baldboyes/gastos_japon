export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, { event }) => {
    console.error('Nitro Error:', error)
    if (event) {
      console.error('Event Path:', event.path)
      console.error('Event Headers:', event.headers)
    }
  })
})
