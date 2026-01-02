<template>
  <NuxtLayout name="default">
    <div class="max-w-screen-sm mx-auto px-4 py-6">
      <!-- First Time Setup Banner -->
      <div v-if="isFirstTime" class="mb-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl">
        <div class="flex items-start gap-3">
          <div class="text-3xl">👋</div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 mb-1">¡Bienvenido!</h2>
            <p class="text-sm text-slate-700">
              Antes de comenzar, configura tu moneda y presupuesto diario para tener una mejor experiencia.
            </p>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 mb-2">Ajustes</h1>
          <p class="text-sm text-slate-600">
            Configura la aplicación según tus preferencias
          </p>
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
            <CardDescription>
              Gestiona tu sesión y perfil
            </CardDescription>
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
                      <pre>{{ user?.emailAddresses?.[0]?.emailAddress || 'No email' }}</pre>
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

        <!-- Currency Setting -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Moneda</CardTitle>
            <CardDescription>
              Selecciona la moneda que utilizarás en tus gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <button
                v-for="currency in CURRENCIES"
                :key="currency.code"
                @click="handleCurrencyChange(currency.code)"
                class="w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:border-teal-300"
                :class="[
                  selectedCurrency === currency.code
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white'
                ]"
              >
                <div class="flex items-center gap-3">
                  <span class="text-3xl">{{ currency.flag }}</span>
                  <div class="text-left">
                    <div class="font-semibold text-slate-900">{{ currency.name }}</div>
                    <div class="text-sm text-slate-600">
                      {{ currency.code }} ({{ currency.symbol }})
                    </div>
                  </div>
                </div>
                <div v-if="selectedCurrency === currency.code" class="text-teal-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <!-- Budget Setting -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Presupuesto Diario</CardTitle>
            <CardDescription>
              Establece tu límite de gasto diario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <Label for="dailyLimit" class="text-sm">Límite Diario</Label>
                  <div class="relative mt-2">
                    <span v-if="currencyInfo" class="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-600">
                      {{ currencyInfo.symbol }}
                    </span>
                    <Input
                      id="dailyLimit"
                      v-model="dailyLimitInput"
                      type="number"
                      min="0"
                      step="100"
                      class="bg-white h-14 text-xl"
                      :class="currencyInfo ? 'pl-10 text-lg' : 'text-lg'"
                      :placeholder="currencyInfo ? '8000' : 'Selecciona una moneda primero'"
                      :disabled="!currencyInfo"
                      @blur="handleBudgetChange"
                    />
                  </div>
                </div>
              </div>
              <p v-if="budget.dailyLimit > 0 && currencyInfo" class="text-xs text-slate-500">
                Presupuesto actual: {{ formatCurrency(budget.dailyLimit) }}
              </p>
              <p v-else class="text-xs text-slate-500">
                {{ currencyInfo ? 'Sin presupuesto configurado' : 'Selecciona una moneda para continuar' }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Data Management -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Gestión de Datos</CardTitle>
            <CardDescription>
              Exporta o importa tus gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <!-- Export Button -->
              <Button
                @click="handleExport"
                variant="outline"
                class="w-full justify-start h-auto py-4"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-teal-50 text-teal-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" x2="12" y1="15" y2="3"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <div class="font-semibold text-slate-900">Exportar datos</div>
                    <div class="text-sm text-slate-600">Descarga una copia de seguridad en JSON</div>
                  </div>
                </div>
              </Button>

              <!-- Import Button -->
              <Button
                @click="triggerImport"
                variant="outline"
                class="w-full justify-start h-auto py-4"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <div class="font-semibold text-slate-900">Importar datos</div>
                    <div class="text-sm text-slate-600">Restaura gastos desde un archivo JSON</div>
                  </div>
                </div>
              </Button>

              <!-- Hidden file input -->
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                @change="handleImport"
                class="hidden"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Danger Zone - Only show if there are expenses -->
        <Card v-if="expenses.length > 0" class="border-red-200">
          <CardHeader>
            <CardTitle class="text-lg text-red-600">Zona de Peligro</CardTitle>
            <CardDescription>
              Acciones irreversibles que afectan tus datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog v-model:open="showDeleteDialog">
              <AlertDialogTrigger as-child>
                <Button variant="destructive" class="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" x2="10" y1="11" y2="17"/>
                    <line x1="14" x2="14" y1="11" y2="17"/>
                  </svg>
                  Eliminar todos los gastos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent class="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle class="flex items-center gap-2 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                      <path d="M12 9v4"/>
                      <path d="M12 17h.01"/>
                    </svg>
                    ¿Estás completamente seguro?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todos tus gastos ({{ expenses.length }} {{ expenses.length === 1 ? 'gasto' : 'gastos' }}). Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <!-- Export option within dialog -->
                <div class="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p class="text-sm font-medium text-teal-900 mb-2">💾 Guardar copia de seguridad</p>
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-full border-teal-300 text-teal-700 hover:bg-teal-100"
                    @click="handleExportBeforeDelete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" x2="12" y1="15" y2="3"/>
                    </svg>
                    Descargar copia ahora
                  </Button>
                  <p v-if="hasExportedBeforeDelete" class="text-xs text-teal-600 mt-2 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    Copia guardada correctamente
                  </p>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel @click="handleCancelDelete">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    class="bg-red-600 hover:bg-red-700"
                    @click="handleDeleteAll"
                  >
                    Sí, eliminar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <div class="text-center text-sm text-gray-400">
          <span>Versión</span> <span class="font-medium">2.6.5</span>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { CURRENCIES } from '~/composables/useSettings'
import type { Currency } from '~/types'
const { user } = useUser()
const { settings, setCurrency, getCurrencyInfo } = useSettings()
const { budget, updateBudget, expenses, getTotalSpent, clearAllData, exportData, importData } = useExpenses()
const { markSetupComplete, isSetupComplete } = useFirstTimeSetup()

const selectedCurrency = computed(() => settings.value.currency)
const currencyInfo = computed(() => getCurrencyInfo())
const dailyLimitInput = ref(budget.value.dailyLimit > 0 ? budget.value.dailyLimit.toString() : '')
const totalSpent = computed(() => getTotalSpent())
const isFirstTime = ref(!isSetupComplete())

// Delete dialog state
const showDeleteDialog = ref(false)
const hasExportedBeforeDelete = ref(false)

// File input ref
const fileInput = ref<HTMLInputElement | null>(null)

// Watch for budget changes from external sources
watch(() => budget.value.dailyLimit, (newLimit) => {
  dailyLimitInput.value = newLimit.toString()
})

function handleCurrencyChange(currency: Currency) {
  setCurrency(currency)
  // Mark setup as complete when currency is changed
  markSetupComplete()
  isFirstTime.value = false
}

function handleBudgetChange() {
  const newLimit = parseFloat(dailyLimitInput.value)
  if (!isNaN(newLimit) && newLimit > 0) {
    updateBudget({ dailyLimit: newLimit })
    // Mark setup as complete when budget is set
    markSetupComplete()
    isFirstTime.value = false
  } else {
    // Reset to current budget if invalid
    dailyLimitInput.value = budget.value.dailyLimit.toString()
  }
}

function formatCurrency(amount: number): string {
  const info = getCurrencyInfo()
  if (!info) return amount.toLocaleString()
  return `${info.symbol}${amount.toLocaleString()}`
}

// Export/Delete handlers
function handleExportBeforeDelete() {
  try {
    const jsonData = exportData()
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gastos-japon-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    hasExportedBeforeDelete.value = true
  } catch (error) {
    console.error('Error exporting data:', error)
    alert('Error al exportar los datos')
  }
}

function handleCancelDelete() {
  hasExportedBeforeDelete.value = false
}

function handleDeleteAll() {
  clearAllData()
  showDeleteDialog.value = false
  hasExportedBeforeDelete.value = false
  // Optionally show success message
  alert('Todos los gastos han sido eliminados')
}

// Export handler
function handleExport() {
  try {
    const jsonData = exportData()
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gastos-japon-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting data:', error)
    alert('Error al exportar los datos')
  }
}

// Import handlers
function triggerImport() {
  fileInput.value?.click()
}

function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const success = importData(content)

      if (success) {
        alert('Datos importados correctamente')
        // Reset file input
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      } else {
        alert('Error al importar los datos. Verifica el formato del archivo.')
      }
    } catch (error) {
      console.error('Error importing data:', error)
      alert('Error al importar los datos')
    }
  }
  reader.readAsText(file)
}
</script>
