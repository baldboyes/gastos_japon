<template>
  <DrawerContent :class="styles.content()">
    <DrawerHeader :class="styles.header()">
      <div :class="styles.headerRow()">
        <DrawerTitle>{{ t('settings.preferences_drawer.title') }}</DrawerTitle>
      </div>
    </DrawerHeader>
    
    <ScrollArea :class="styles.scrollArea()">
      <div :class="styles.body()">
        <div :class="styles.section()">
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">{{ t('settings.preferences_drawer.currency.title') }}</CardTitle>
              <CardDescription>{{ t('settings.preferences_drawer.currency.description') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <CurrencySelector v-model="userCurrency" @update:modelValue="updateCurrency" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-lg">{{ t('settings.preferences_drawer.language.title') }}</CardTitle>
              <CardDescription>{{ t('settings.preferences_drawer.language.description') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select :model-value="currentLocale" @update:model-value="(v) => changeLocale(String(v))">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="String(t('settings.preferences_drawer.language.placeholder'))" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="l in availableLocales" :key="l.code" :value="l.code">
                    {{ t(`settings.preferences_drawer.language.locales.${l.code}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  </DrawerContent>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { tv } from 'tailwind-variants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { DrawerContent, DrawerHeader, DrawerTitle } from '~/components/ui/drawer'
import { ScrollArea } from '~/components/ui/scroll-area'
import { CurrencySelector } from '~/components/ui/CurrencySelector'
import { useDirectusRepo } from '~/composables/useDirectusRepo'
import { readMe, updateUser } from '@directus/sdk'
import { toast } from 'vue-sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useRoute } from 'vue-router'
import { useCookie, useI18n } from '#imports'

const { user } = useUser()
const { getClient, directusUserId } = useDirectusRepo()
const route = useRoute()
const i18n = useI18n()
const { t } = useI18n()

const userLocaleCookie = useCookie<string | null>('user-locale', {
  default: () => null,
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})

const styles = computed(() => preferencesDrawer())

const userCurrency = ref('EUR')
const isLoading = ref(false)

const preferencesDrawer = tv({
  slots: {
    content: 'h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4',
    header: 'w-full max-w-xl mx-auto px-0',
    headerRow: 'flex items-center justify-between mb-2',
    scrollArea: 'flex-1 h-[calc(90vh-180px)] px-0 pb-0',
    body: 'max-w-xl mx-auto flex gap-16 flex-col lg:flex-row pr-4 pb-8',
    section: 'space-y-6 w-full'
  }
})

const currentLocale = computed(() => {
  const candidate = (route.path || '').split('/')[1] || ''
  const all = i18n?.$getLocales?.() || []
  const codes = all.map((l: any) => l.code)
  return codes.includes(candidate) ? candidate : 'en'
})

const availableLocales = computed(() => {
  if (!i18n || !(i18n as any).$getLocales) return []
  return (i18n as any).$getLocales() || []
})

const changeLocale = (code: string) => {
  userLocaleCookie.value = code
  ;(i18n as any)?.$switchLocale?.(code)
  toast.success(String(t('settings.preferences_drawer.language.toast_success')))
}

// Fetch user preferences
const fetchUserPreferences = async () => {
  if (!user.value) return
  
  try {
    isLoading.value = true
    const client = await getClient()
    const userData = await client.request(readMe({
      fields: ['moneda']
    } as any)) as any
    
    if (userData && userData.moneda) {
      userCurrency.value = userData.moneda
    }
  } catch (e) {
    console.error('Error fetching user preferences:', e)
  } finally {
    isLoading.value = false
  }
}

// Update currency
const updateCurrency = async (newCurrency: string) => {
  if (!newCurrency) return
  
  try {
    const client = await getClient()
    if (!directusUserId.value) {
       console.error('No Directus user ID available')
       return
    }
    await client.request(updateUser(directusUserId.value, {
      moneda: newCurrency
    } as any))
    toast.success(String(t('settings.preferences_drawer.currency.toast_success')))
  } catch (e) {
    console.error('Error updating currency:', e)
    toast.error(String(t('settings.preferences_drawer.currency.toast_error')))
  }
}

onMounted(() => {
  if (user.value) {
    fetchUserPreferences()
  }
})

// Watch for user login to fetch data
watch(user, (newUser) => {
  if (newUser) {
    fetchUserPreferences()
  }
})
</script>
