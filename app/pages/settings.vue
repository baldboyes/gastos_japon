<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 mb-2">Ajustes</h1>
        </div>
        
        <!-- User Profile -->
        <SignedIn>
          <div class="flex flex-col items-center gap-1 px-4 py-2 justify-center min-h-[44px]">
            <div v-if="user?.imageUrl" class="w-8 h-8 rounded-full overflow-hidden">
              <img :src="user.imageUrl" alt="Perfil" class="w-full h-full object-cover" />
            </div>
          </div>
        </SignedIn>
      </div>

      <!-- Settings Sections -->
      <div class="space-y-6">
        <!-- Account Settings -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <!-- Signed In State -->
            <SignedIn>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div>
                    <div class="font-medium text-slate-900">Sesión iniciada</div>
                    <div class="text-sm text-slate-500">
                      {{ user?.firstName || 'Usuario' }} {{ user?.lastName || '' }}<br />
                      <span class="truncate block max-w-[200px]">{{ user?.emailAddresses?.[0]?.emailAddress || 'No email' }}</span>
                    </div>
                  </div>
                </div>
                
                <SignOutButton>
                  <Button variant="outline" class="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" x2="9" y1="12" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </Button>
                </SignOutButton>
              </div>
            </SignedIn>

            <!-- Signed Out State -->
            <SignedOut>
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-slate-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">No has iniciado sesión</div>
                    <div class="text-sm text-slate-500">Inicia sesión para sincronizar tus datos</div>
                  </div>
                </div>
                
                <SignInButton mode="modal">
                  <Button class="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" x2="3" y1="12" y2="12"/>
                    </svg>
                    Iniciar sesión
                  </Button>
                </SignInButton>
              </div>
            </SignedOut>
          </CardContent>
        </Card>

        <!-- Application Preferences -->
        <SignedIn>
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Preferencias de Aplicación</CardTitle>
              <CardDescription>
                Configura tus preferencias globales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label>Moneda por defecto</Label>
                  <CurrencySelector v-model="userCurrency" @update:modelValue="updateCurrency" />
                  <p class="text-xs text-muted-foreground">
                    Esta moneda se usará por defecto en tus nuevos viajes y gastos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </SignedIn>

        <div class="text-center text-sm text-gray-400">
          <span>Versión</span> <span class="font-medium">2.7.0</span>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import CurrencySelector from '~/components/ui/CurrencySelector/CurrencySelector.vue'
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