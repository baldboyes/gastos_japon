export default defineNuxtPlugin(() => {
  // El registro del service worker se maneja automáticamente por @vite-pwa/nuxt
  // Este plugin solo se ejecuta en el cliente para asegurar que todo esté listo
  
  if (typeof window !== 'undefined') {
    // Verificar manifest cuando el DOM esté listo
    const checkManifest = () => {
      const manifestLink = document.querySelector('link[rel="manifest"]')
      if (manifestLink) {
        const href = manifestLink.getAttribute('href')
        console.log('✅ Manifest encontrado:', href)
        
        // Intentar cargar el manifest para verificar que existe
        fetch(href!)
          .then(response => {
            if (response.ok) {
              return response.json()
            }
            throw new Error(`Status: ${response.status}`)
          })
          .then(manifest => {
            console.log('✅ Manifest cargado correctamente:', manifest.name)
            console.log('📱 Iconos:', manifest.icons?.length || 0)
          })
          .catch(error => {
            console.error('❌ Error al cargar manifest:', error)
          })
      } else {
        console.warn('⚠️ Link al manifest no encontrado en el HTML')
        console.log('Intentando agregar manualmente...')
        
        // Intentar agregar el link al manifest manualmente como fallback
        const link = document.createElement('link')
        link.rel = 'manifest'
        link.href = '/manifest.webmanifest'
        document.head.appendChild(link)
        console.log('✅ Link al manifest agregado manualmente')
      }
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkManifest)
    } else {
      checkManifest()
    }
    
    // Escuchar eventos de instalación de PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir que Chrome muestre el prompt automáticamente
      e.preventDefault()
      // Guardar el evento para mostrarlo más tarde si es necesario
      console.log('🎉 PWA puede ser instalada!')
    })
    
    // Detectar cuando la app se instala
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA instalada exitosamente!')
    })
    
    // Verificar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('✅ Service Worker activo:', registration.active?.state)
      })
    }
  }
})

