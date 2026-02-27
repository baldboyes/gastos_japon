<template>
  <div class="w-full h-full overflow-x-hidden bg-gray-50">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useI18n, useCookie, useSeoMeta, useHead } from '#imports'
  import 'vue-sonner/style.css'
  
  // Forzar lectura de cookie de idioma al inicio
  // Solo ejecutar en cliente para evitar inconsistencias de hidratación inicial si es necesario
  onMounted(async () => {
    // La lógica se ha movido a /plugins/01.i18n-restore.ts para ejecutarse antes
  })

  // Meta tags para PWA
  useSeoMeta({
    title: 'jizou.io',
    description: 'Aplicación para gestionar viajes',
    themeColor: '#40C4AA',
    viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    appleItunesApp: undefined,
  })

  // Head adicional para PWA
  useHead({
    meta: [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'jizou.io' },
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
<style>
  .page-enter-active,
  .page-leave-active {
    transition: all 0.4s;
  }
  .page-enter-from,
  .page-leave-to {
    opacity: 0;
    filter: blur(1rem);
  }
</style>