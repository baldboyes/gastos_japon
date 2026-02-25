<template>
  <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4">

    <DrawerHeader class="w-full max-w-xl mx-auto px-0">
      <div class="flex items-center justify-between mb-2">
        <DrawerTitle>Notificaciones</DrawerTitle>
        <Button v-if="unreadCount > 0" size="sm" @click="markAllAsRead">
          Marcar todo como leído
        </Button>
      </div>
    </DrawerHeader>
    <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
      <div class="max-w-xl mx-auto flex gap-16 flex-col lg:flex-row pr-4 pb-8">

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
            <CurrencySelector 
              :model-value="selectedCurrency" 
              @update:model-value="handleCurrencyChange" 
            />
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
            <p v-if="displayDailyLimit > 0 && currencyInfo" class="text-xs text-slate-500">
              Presupuesto actual: {{ formatCurrency(displayDailyLimit) }}
            </p>
            <p v-else class="text-xs text-slate-500">
              {{ currencyInfo ? 'Sin presupuesto configurado' : 'Selecciona una moneda para continuar' }}
            </p>
          </div>
        </CardContent>
      </Card>


      <div class="text-center text-sm text-gray-400">
        <span>Versión</span> <span class="font-medium">0.6.5</span>
      </div>
    </div>


      </div>
    </ScrollArea>
  </DrawerContent>


</template>

<script setup lang="ts">
import type { Currency } from '~/types'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { CurrencySelector } from '~/components/ui/CurrencySelector'
import { CURRENCIES } from '~/composables/useSettings'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '~/components/ui/alert-dialog'

const { user } = useUser()
const { settings, setCurrency, getCurrencyInfo } = useSettings()
const { budget, updateBudget, expenses, getTotalSpent, clearAllData, exportData, importData } = useExpenses()
const { markSetupComplete, isSetupComplete } = useFirstTimeSetup()
const { currentTrip, updateTrip } = useTrips()

const selectedCurrency = computed(() => currentTrip.value?.moneda || settings.value.currency)
const currencyInfo = computed(() => {
  const code = currentTrip.value?.moneda || settings.value.currency
  if (!code) return null
  return CURRENCIES.find(c => c.code === code) || null
})

const dailyLimitInput = ref(
  currentTrip.value 
    ? (currentTrip.value.presupuesto_diario?.toString() || '')
    : (budget.value.dailyLimit > 0 ? budget.value.dailyLimit.toString() : '')
)

const displayDailyLimit = computed(() => 
  currentTrip.value 
    ? (currentTrip.value.presupuesto_diario || 0)
    : budget.value.dailyLimit
)

const totalSpent = computed(() => getTotalSpent())
const isFirstTime = ref(!isSetupComplete())

// Delete dialog state
const showDeleteDialog = ref(false)
const hasExportedBeforeDelete = ref(false)

// File input ref
const fileInput = ref<HTMLInputElement | null>(null)

// Watch for budget changes from external sources
watch(() => currentTrip.value, (trip) => {
  if (trip && trip.presupuesto_diario) {
    dailyLimitInput.value = trip.presupuesto_diario.toString()
  }
}, { deep: true })

watch(() => budget.value.dailyLimit, (newLimit) => {
  if (!currentTrip.value) {
    dailyLimitInput.value = newLimit.toString()
  }
})

async function handleCurrencyChange(currency: Currency) {
  if (currentTrip.value) {
    await updateTrip(currentTrip.value.id, { moneda: currency })
  }
  setCurrency(currency)
  // Mark setup as complete when currency is changed
  markSetupComplete()
  isFirstTime.value = false
}

async function handleBudgetChange() {
  const newLimit = parseFloat(dailyLimitInput.value)
  if (!isNaN(newLimit) && newLimit > 0) {
    if (currentTrip.value) {
      await updateTrip(currentTrip.value.id, { presupuesto_diario: newLimit })
    }
    updateBudget({ dailyLimit: newLimit })
    // Mark setup as complete when budget is set
    markSetupComplete()
    isFirstTime.value = false
  } else {
    // Reset to current budget if invalid
    dailyLimitInput.value = currentTrip.value?.presupuesto_diario?.toString() || budget.value.dailyLimit.toString()
  }
}

function formatCurrency(amount: number): string {
  const info = currencyInfo.value
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
