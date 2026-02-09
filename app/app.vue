<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
  import 'vue-sonner/style.css'

  // Meta tags para PWA
  useSeoMeta({
    title: 'Me voy a Japón',
    description: 'Aplicación para gestionar el viaje a Japón',
    themeColor: '#40C4AA',
    viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    appleItunesApp: undefined,
  })

  // Head adicional para PWA
  useHead({
    meta: [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Me voy a Japón' },
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' }
    ],
    bodyAttrs: {
      /* class: 'overflow-hidden' */
    }
  })
</script>
