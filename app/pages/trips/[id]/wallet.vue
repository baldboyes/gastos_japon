<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Wallet, TrendingUp, ArrowRightLeft, Plus, Trash2 } from 'lucide-vue-next'
import { useWallet } from '~/composables/useWallet'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { toast } from 'vue-sonner'

const route = useRoute()
const tripId = route.params.id as string

const { 
  cambios, fetchCambios,
  createCambio, deleteCambio, 
  totalInvestedEUR, totalJPYAcquired, currentJPYBalance,
  paymentBreakdown 
} = useWallet()

// Fetch data
fetchCambios(tripId)

// --- Modal State ---
const isModalOpen = ref(false)
const formData = ref<{
  fecha: string
  origen_eur: number
  destino_jpy: number
  lugar: string
  destino_fondo: 'efectivo' | 'tarjeta' | 'suica'
}>({
  fecha: new Date().toISOString().slice(0, 16),
  origen_eur: 0,
  destino_jpy: 0,
  lugar: '',
  destino_fondo: 'efectivo'
})

const handleSave = async () => {
  try {
    await createCambio({
      ...formData.value,
      viaje_id: parseInt(tripId)
    })
    isModalOpen.value = false
    formData.value = {
      fecha: new Date().toISOString().slice(0, 16),
      origen_eur: 0,
      destino_jpy: 0,
      lugar: '',
      destino_fondo: 'efectivo'
    }
    toast.success('Cambio registrado')
  } catch (e) {
    toast.error('Error al registrar cambio')
  }
}

const formatEUR = (v: number) => formatCurrency(v, 'EUR')
const formatJPY = (v: number) => formatCurrency(v, 'JPY')
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Finanzas y Divisas</h2>
          <p class="text-muted-foreground">Controla el cambio de moneda y el balance de tus cuentas.</p>
        </div>
      </div>
      
      <!-- RESUMEN FINANCIERO -->
      <div class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Inversión Total</CardTitle>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatEUR(totalInvestedEUR) }}</div>
            <p class="text-xs text-muted-foreground">Gastos en EUR + Cambios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Yenes Disponibles</CardTitle>
            <Wallet class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold" :class="currentJPYBalance < 0 ? 'text-red-500' : 'text-green-600'">
              {{ formatJPY(currentJPYBalance) }}
            </div>
            <p class="text-xs text-muted-foreground">Saldo actual (Cash + Tarjeta)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Cambiado</CardTitle>
            <ArrowRightLeft class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatJPY(totalJPYAcquired) }}</div>
            <p class="text-xs text-muted-foreground">Suma de todos los cambios</p>
          </CardContent>
        </Card>
      </div>

      <!-- ESTADO DE PAGOS -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold tracking-tight">Estado de Pagos (Reservas)</h3>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Pagado (EUR)</CardTitle>
              <div class="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ formatEUR(paymentBreakdown.eur.paid) }}</div>
              <p class="text-xs text-muted-foreground">Vuelos, Hoteles, etc.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Pendiente (EUR)</CardTitle>
              <div class="h-2 w-2 rounded-full bg-orange-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold text-orange-600">{{ formatEUR(paymentBreakdown.eur.pending) }}</div>
              <p class="text-xs text-muted-foreground">Por pagar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Pagado (JPY)</CardTitle>
              <div class="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ formatJPY(paymentBreakdown.jpy.paid) }}</div>
              <p class="text-xs text-muted-foreground">Ya desembolsado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">Pendiente (JPY)</CardTitle>
              <div class="h-2 w-2 rounded-full bg-orange-500" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold text-orange-600">{{ formatJPY(paymentBreakdown.jpy.pending) }}</div>
              <p class="text-xs text-muted-foreground">Reservar efectivo/tarjeta</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- LISTA DE CAMBIOS -->
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <div class="flex items-center gap-2">
            <ArrowRightLeft class="h-5 w-5 text-indigo-500" />
            <CardTitle class="text-lg">Historial de Cambios</CardTitle>
          </div>
          <Button size="sm" @click="isModalOpen = true"><Plus class="h-4 w-4 mr-2" /> Añadir Cambio</Button>
        </CardHeader>
        <CardContent>
          <div v-if="cambios.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <Wallet class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">No hay cambios registrados</h3>
            <p class="max-w-md mx-auto mt-2">Añade tus cambios de divisa para llevar el control.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="c in cambios" :key="c.id" class="flex justify-between items-center p-3 border rounded hover:bg-slate-50">
              <div>
                <div class="font-medium flex items-center gap-2">
                  {{ formatEUR(c.origen_eur) }} <span class="text-muted-foreground">➜</span> {{ formatJPY(c.destino_jpy) }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ new Date(c.fecha).toLocaleDateString() }} • {{ c.lugar }} • <span class="capitalize">{{ c.destino_fondo }}</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right text-xs text-muted-foreground">
                  Rate: {{ (c.destino_jpy / c.origen_eur).toFixed(2) }}
                </div>
                <button @click="deleteCambio(c.id)" class="text-red-400 hover:text-red-600"><Trash2 class="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- MODAL NUEVO CAMBIO -->
      <Dialog v-model:open="isModalOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Cambio de Divisa</DialogTitle>
          </DialogHeader>
          
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div><Label>Entregado (EUR)</Label><Input type="number" v-model="formData.origen_eur" /></div>
              <div><Label>Recibido (JPY)</Label><Input type="number" v-model="formData.destino_jpy" /></div>
            </div>
            
            <div><Label>Fecha</Label><Input type="datetime-local" v-model="formData.fecha" /></div>
            <div><Label>Lugar (Casa de cambio / Banco)</Label><Input v-model="formData.lugar" /></div>
            
            <div>
              <Label>Destino del dinero</Label>
              <Select v-model="formData.destino_fondo">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo (Cartera)</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta (Revolut/N26)</SelectItem>
                  <SelectItem value="suica">Suica / IC Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button @click="handleSave">Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  </NuxtLayout>
</template>
