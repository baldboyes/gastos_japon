<template>
  <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4">
    <DrawerHeader class="w-full max-w-xl mx-auto px-0">
      <div class="flex items-center justify-between mb-2">
        <DrawerTitle>Preferencias de Aplicación</DrawerTitle>
      </div>
      <DrawerDescription>
        Configura tus preferencias globales
      </DrawerDescription>
    </DrawerHeader>
    
    <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
       <div class="max-w-xl mx-auto flex gap-16 flex-col lg:flex-row pr-4 pb-8">
         <div class="space-y-6 w-full">
            <Card>
               <CardHeader>
                 <CardTitle class="text-lg">Tu Moneda Base</CardTitle>
                 <CardDescription>Esta es tu moneda local. Se utilizará para calcular los tipos de cambio y mostrarte el equivalente de tus gastos en tu moneda habitual.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div class="space-y-4">
                    <CurrencySelector v-model="userCurrency" @update:modelValue="updateCurrency" />
                 </div>
               </CardContent>
            </Card>
         </div>
       </div>
    </ScrollArea>
  </DrawerContent>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '~/components/ui/drawer'
import { ScrollArea } from '~/components/ui/scroll-area'
import { CurrencySelector } from '~/components/ui/CurrencySelector'
import { useDirectus } from '~/composables/useDirectus'
import { readMe, updateUser } from '@directus/sdk'
import { toast } from 'vue-sonner'

const { user } = useUser()
const { getAuthenticatedClient, directusUserId } = useDirectus()

const userCurrency = ref('EUR')
const isLoading = ref(false)

// Fetch user preferences
const fetchUserPreferences = async () => {
  if (!user.value) return
  
  try {
    isLoading.value = true
    const client = await getAuthenticatedClient()
    const userData = await client.request(readMe({
      fields: ['moneda']
    }))
    
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
    const client = await getAuthenticatedClient()
    if (!directusUserId.value) {
       console.error('No Directus user ID available')
       return
    }
    await client.request(updateUser(directusUserId.value, {
      moneda: newCurrency
    }))
    toast.success('Preferencia de moneda actualizada')
  } catch (e) {
    console.error('Error updating currency:', e)
    toast.error('Error al actualizar la moneda')
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
