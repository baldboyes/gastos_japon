<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Banknote, Calendar, MapPin, ArrowRightLeft, Loader2 } from 'lucide-vue-next'
import { useTripsNew } from '~/composables/useTripsNew'
import { useExchangeRate } from '~/composables/useExchangeRate'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { formatCurrency } from '~/utils/currency'
import { useTripTasksNew } from '~/composables/useTripTasksNew'
import { type Task } from '~/types/directus'
import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
import TaskModal from '~/components/trips/tasks/TaskModal.vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

  const route = useRoute()
  const tripId = parseInt(route.params.id as string)

const { currentTrip, getTrip } = useTripsNew()
const { rate, loading: rateLoading, fetchRate, lastUpdated } = useExchangeRate()
const { t } = useI18n()
const { tasks, fetchTasks, updateTask } = useTripTasksNew()
const isTaskModalOpen = ref(false)
const selectedTaskToEdit = ref<Task | null>(null)

onMounted(async () => {
    fetchRate()
    if (!currentTrip.value || currentTrip.value.id !== tripId) {
      await getTrip(tripId)
    }
    fetchTasks(tripId)
})

const tripCurrency = computed(() => currentTrip.value?.currency || 'JPY')

const daysUntil = computed(() => {
    if (!currentTrip.value?.start_date) return 0
    const start = new Date(currentTrip.value.start_date)
    const now = new Date()
    const diff = start.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
})

const countdownText = computed(() => {
    if (daysUntil.value <= 0) return t('trip_overview_page.countdown.in_progress')
    const unitKey = daysUntil.value === 1 ? 'trip_overview_page.countdown.day' : 'trip_overview_page.countdown.days'
    return `${daysUntil.value} ${t(unitKey)}`
})

  const handleEditTask = (task: Task) => {
    selectedTaskToEdit.value = task
    isTaskModalOpen.value = true
  }

  const handleAddTask = () => {
    selectedTaskToEdit.value = null
    isTaskModalOpen.value = true
  }

  const allGeneralTasks = computed(() => {
    return tasks.value.filter(t => {
      // Check direct entity type
      if (t.entity_type === 'travel') return true
      
      // Check group entity type if task doesn't have it set directly
      // In new schema, task_group is just a string, so we rely on entity_type mostly
      // Or if task_group is "General"
      if (!t.entity_type && (!t.task_group || t.task_group === 'General')) return true
      
      return false
    })
  })



</script>

<template>
    <div>
        <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            <div class="flex flex-col lg:flex-row gap-8 items-start relative">
                <!-- Main Content -->
                <div class="flex-1 w-full space-y-4">

                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle class="text-sm font-medium">{{ $t('trip_overview_page.countdown.title') }}</CardTitle>
                                <Calendar class="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div class="text-2xl font-bold">{{ countdownText }}</div>
                                <p class="text-xs text-muted-foreground">{{ $t('trip_overview_page.countdown.subtitle') }}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle class="text-sm font-medium">{{ $t('trip_overview_page.daily_budget.title') }}</CardTitle>
                                <Banknote class="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div class="text-2xl font-bold">
                                    {{ currentTrip?.daily_budget ? formatCurrency(currentTrip.daily_budget, tripCurrency) : $t('trip_overview_page.common.na') }}
                                </div>
                                <p class="text-xs text-muted-foreground">{{ $t('trip_overview_page.daily_budget.subtitle') }}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle class="text-sm font-medium">{{ $t('trip_overview_page.exchange.title') }}</CardTitle>
                                <ArrowRightLeft class="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div v-if="rateLoading">
                                    <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                                <div v-else>
                                    <div class="text-2xl font-bold">1€ = {{ rate ? rate.toFixed(2) : '---' }}¥</div>
                                    <p class="text-xs text-muted-foreground">
                                        {{ lastUpdated ? $t('trip_overview_page.exchange.updated_prefix') + ' ' + lastUpdated.toLocaleDateString() : $t('trip_overview_page.exchange.market') }}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
                <!-- Sidebar Tasks -->
                <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
                    <TasksSidebar 
                        :tasks="allGeneralTasks"
                        @update:status="(id, status) => updateTask(id, { status })"
                        @edit="handleEditTask"
                        @add="handleAddTask"
                    />
                    <div class="bg-neutral-800 rounded-2xl overflow-visible mt-4 h-[80px] w-full flex items-center justify-center relative border border-neutral-700">
                        <div class="text-xs font-normal border border-white bg-neutral-800 text-neutral-200 absolute -top-2 right-4 px-4 rounded-full">Patrocinado</div>
                        <NuxtLink to="https://www.porjapon.com/" target="_blank" class="flex items-center justify-center gap-2 w-full">
                            <img src="/anuncio/porjapon.svg" class="size-10" alt="Por Japon" /> <span class="font-semibold text-xl text-white">porjapon.com</span>
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <TaskModal 
          v-model:open="isTaskModalOpen" 
          :task="selectedTaskToEdit" 
          :trip-id="tripId"
          default-group-id="General"
          default-entity-type="travel"
          @saved="fetchTasks(tripId)"
        />
    </div>
</template>
