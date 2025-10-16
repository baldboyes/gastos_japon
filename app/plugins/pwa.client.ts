export default defineNuxtPlugin(() => {
  // El registro del service worker se maneja automáticamente por @vite-pwa/nuxt
  // Este plugin solo se ejecuta en el cliente para asegurar que todo esté listo
  
  if (typeof window !== 'undefined') {
    // Log para verificar que el PWA está activo (solo en desarrollo)
    if (import.meta.env.DEV) {
      console.log('PWA Plugin initialized')
      
      // Verificar si el manifest está disponible
      const manifestLink = document.querySelector('link[rel="manifest"]')
      if (manifestLink) {
        console.log('Manifest encontrado:', manifestLink.getAttribute('href'))
      } else {
        console.warn('Manifest no encontrado')
      }
    }
    
    // Escuchar eventos de instalación de PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir que Chrome muestre el prompt automáticamente
      e.preventDefault()
      // Guardar el evento para mostrarlo más tarde si es necesario
      console.log('PWA puede ser instalada')
    })
    
    // Detectar cuando la app se instala
    window.addEventListener('appinstalled', () => {
      console.log('PWA instalada exitosamente')
    })
  }
})

