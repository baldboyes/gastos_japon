<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '#imports'
import { Button } from '@/components/ui/button'
import AppLogo from '@/components/common/AppLogo.vue'
import HeaderUserMenu from '@/components/layout/HeaderUserMenu.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { SignInButton, SignedIn, SignedOut, ClerkLoaded, ClerkLoading } from '@clerk/vue'
import { useWindowScroll } from '@vueuse/core'
import { CircleUserRound, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const { $localeRoute } = useI18n()
const { y } = useWindowScroll()
const isScrolled = computed(() => y.value > 20)
</script>

<template>
  <nav 
    class="fixed left-1/2 -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-50"
    :class="[
      isScrolled 
        ? 'top-6 w-[95%] max-w-xl rounded-full bg-white/50 backdrop-blur-xl shadow-none hover:shadow-md hover:bg-white/80' 
        : 'top-6 w-full max-w-3xl rounded-none bg-transparent shadow-none'
    ]"
  >
    <div 
      class="flex items-center justify-between transition-all duration-500 px-4 md:px-6"
      :class="isScrolled ? 'h-20 w-full' : 'h-20 container mx-auto'"
    >
      <AppLogo :compact="isScrolled" />
      
      <div class="flex items-center gap-4">
        
        <NuxtLink 
          :to="$localeRoute({ name: 'precios' })"
          class="text-base font-medium transition-colors hidden sm:block hover:text-red-500"
          :class="route.path.includes('/precios') || route.path.includes('/pricing') ? 'text-red-400' : 'text-slate-600'"
        >
          {{ $t('header.pricing') }}
        </NuxtLink>

        <NuxtLink 
          :to="$localeRoute({ name: 'tienda' })" 
          class="text-base font-medium transition-colors hidden sm:block hover:text-red-500"
          :class="route.path.includes('/tienda') || route.path.includes('/shop') ? 'text-red-400' : 'text-slate-600'"
        >
          {{ $t('header.shop') }}
        </NuxtLink>

        <ClerkLoading>
          <div class="flex items-center justify-center w-9 px-0">
            <Loader2 class="h-5! w-5! animate-spin text-slate-600" />
          </div>
        </ClerkLoading>

        <ClerkLoaded>
          <!-- Usuario Logueado -->
          <SignedIn>
            <NuxtLink 
              :to="$localeRoute({ name: 'trips' })" 
              class="text-base font-medium transition-colors hidden sm:block hover:text-red-500"
              :class="route.path.includes('/trips') ? 'text-red-400' : 'text-slate-600'"
            >
              {{ $t('header.my_trips') }}
            </NuxtLink>

            <HeaderUserMenu />
          </SignedIn>

          <!-- Usuario No Logueado -->
          <SignedOut>
            <SignInButton mode="modal" force-redirect-url="/">

              <Button variant="ghost" size="icon" class="w-9 px-0">
                <CircleUserRound class="h-5! w-5!" /> 
                <span class="sr-only">{{ $t('header.sign_in') }}</span>
              </Button>

            </SignInButton>
          </SignedOut>
        </ClerkLoaded>

        <LanguageSwitcher />
      </div>
    </div>
  </nav>
</template>
