<template>
  <div class="min-h-screen bg-gray-50 text-slate-950 selection:bg-purple-500/30">
    <!-- Navbar -->
    <AppHeader />
    
    <!-- Main content -->
    <main class="">
      <slot />
    </main>

    <!-- Footer -->
    <AppFooter />
    
    <Toaster position="top-center" />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import AppFooter from '~/components/layout/AppFooter.vue'
import { Toaster } from '~/components/ui/sonner'
</script>
