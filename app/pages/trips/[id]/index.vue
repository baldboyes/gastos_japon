<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Banknote, Calendar, MapPin, ArrowRightLeft, Loader2 } from 'lucide-vue-next'
import { useTrips } from '~/composables/useTrips'
import { useExchangeRate } from '~/composables/useExchangeRate'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { formatCurrency } from '~/utils/currency'

const route = useRoute()
const tripId = route.params.id as string
const { currentTrip } = useTrips()
const { rate, loading: rateLoading, fetchRate, lastUpdated } = useExchangeRate()

onMounted(() => {
    fetchRate()
})

const tripCurrency = computed(() => currentTrip.value?.moneda || 'JPY')

const daysUntil = computed(() => {
    if (!currentTrip.value?.fecha_inicio) return 0
    const start = new Date(currentTrip.value.fecha_inicio)
    const now = new Date()
    const diff = start.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
})
</script>

<template>
  <NuxtLayout name="dashboard">
        <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            <div class="flex flex-col lg:flex-row gap-8 items-start relative">
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Cuenta Atrás</CardTitle>
                            <Calendar class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">{{ daysUntil > 0 ? daysUntil + ' días' : '¡En curso!' }}</div>
                            <p class="text-xs text-muted-foreground">Para el inicio del viaje</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Presupuesto Diario</CardTitle>
                            <Banknote class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div class="text-2xl font-bold">
                                {{ currentTrip?.presupuesto_diario ? formatCurrency(currentTrip.presupuesto_diario, tripCurrency) : 'N/A' }}
                            </div>
                            <p class="text-xs text-muted-foreground">Objetivo de gasto</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle class="text-sm font-medium">Cambio Divisa</CardTitle>
                            <ArrowRightLeft class="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div v-if="rateLoading" class="flex items-center h-8">
                                <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                            <div v-else>
                                <div class="text-2xl font-bold">1€ = {{ rate ? rate.toFixed(2) : '---' }}¥</div>
                                <p class="text-xs text-muted-foreground">
                                    {{ lastUpdated ? 'Act. ' + lastUpdated.toLocaleDateString() : 'Mercado de divisas' }}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </NuxtLayout>
</template>
