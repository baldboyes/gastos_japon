<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCookie, useI18n } from '#imports'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Languages } from 'lucide-vue-next'

const route = useRoute()
const i18n = useI18n()
const userLocaleCookie = useCookie<string | null>('user-locale', {
  default: () => null,
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})
// En nuxt-i18n-micro, 'locale' es una ref, pero a veces puede no estar disponible inmediatamente
// Usamos un computed seguro para acceder al valor
const currentLocale = computed(() => {
  const candidate = (route.path || '').split('/')[1] || ''
  const all = i18n?.$getLocales?.() || []
  const codes = all.map(l => l.code)
  return codes.includes(candidate) ? candidate : 'en'
})

const availableLocales = computed(() => {
  if (!i18n || !i18n.$getLocales) return []
  return i18n.$getLocales() || []
})

function changeLocale(code: string) {
  userLocaleCookie.value = code
  i18n?.$switchLocale?.(code)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="w-9 px-0">
        <Languages class="h-5! w-5!" /> 
        <span class="sr-only">{{ $t('user_menu.language') }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem v-for="l in availableLocales" :key="l.code" @click="changeLocale(l.code)">
        <span :class="{ 'font-semibold text-red-400': currentLocale === l.code }">
          <span v-if="l.code === 'en'">English</span>
          <span v-else-if="l.code === 'es'">Español</span>
          <span v-else>日本語</span>
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
