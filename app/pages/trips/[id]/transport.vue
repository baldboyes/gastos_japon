<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { Train, Plus, Trash2, Pencil, Calendar, ArrowRight, Bus, Ship, Car, Footprints, MoreVertical, FileDown } from 'lucide-vue-next'
  import { useTripOrganizationNew } from '~/composables/useTripOrganizationNew'
  import { useTripsNew } from '~/composables/useTripsNew'
  import { useDirectusFiles } from '~/composables/useDirectusFiles'
  import { formatDateTime, formatDateWithDayShort, formatTime } from '~/utils/dates'
  import { formatCurrency } from '~/utils/currency'
  import { cn } from '~/lib/utils'
  import { getPaymentStatusPillClass } from '~/utils/payment-status'
  import { groupByDate } from '~/utils/grouping'
  import TransportDrawer from '~/components/trips/drawers/TransportDrawer.vue'
  import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'
  import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
  import TaskModal from '~/components/trips/tasks/TaskModal.vue'
  import { useTripTasksNew } from '~/composables/useTripTasksNew'
  import { type Task } from '~/types/directus'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '~/components/ui/dropdown-menu'
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '~/components/ui/alert-dialog'

  definePageMeta({
    layout: 'dashboard'
  })
  const route = useRoute()
  const tripId = parseInt(route.params.id as string)

  const { currentTrip } = useTripsNew()
  const { transports, fetchOrganizationData, deleteTransport } = useTripOrganizationNew()
  const { tasks, fetchTasks, updateTask } = useTripTasksNew()
  const { downloadFile } = useDirectusFiles()

  const isTaskModalOpen = ref(false)
  const selectedTaskToEdit = ref<Task | null>(null)

  const allTransportTasks = computed(() => {
    return tasks.value.filter(t => {
      // Check direct entity type
      if (t.entity_type === 'transport' || t.entity_type === 'transports') return true
      
      // Check group entity type if task doesn't have it set directly
      if (!t.entity_type && t.task_group === 'Transporte') return true
      
      return false
    })
  })

  const handleEditTask = (task: Task) => {
    selectedTaskToEdit.value = task
    isTaskModalOpen.value = true
  }

  const handleAddTask = () => {
    selectedTaskToEdit.value = null
    isTaskModalOpen.value = true
  }

  const isModalOpen = ref(false)
  const itemToEdit = ref(null)

  const isDeleteOpen = ref(false)
  const transportToDelete = ref<number | null>(null)

  const confirmDelete = (id: number) => {
    transportToDelete.value = id
    isDeleteOpen.value = true
  }

  const executeDelete = async () => {
    if (transportToDelete.value) {
      await deleteTransport(transportToDelete.value)
      isDeleteOpen.value = false
      transportToDelete.value = null
    }
  }

  const handleCreateTransport = () => {
    itemToEdit.value = null
    isModalOpen.value = true
  }

  const handleEditTransport = (t: any) => {
    itemToEdit.value = t
    isModalOpen.value = true
  }

  const onSaved = () => {
    fetchOrganizationData(tripId)
  }

  onMounted(() => {
    fetchOrganizationData(tripId)
    fetchTasks(tripId)
  })

  // Group transports by type
  const passes = computed(() => transports.value.filter(t => t.category === 'pass'))
  const routes = computed(() => transports.value.filter(t => t.category === 'route'))

  const getTransportIcon = (type: string) => {
    switch(type) {
      case 'train': return Train
      case 'bus': return Bus
      case 'ferry': return Ship
      case 'taxi': return Car
      case 'walk': return Footprints
      default: return Train
    }
  }
</script>

<template>
  <div>
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row gap-8 items-start relative">
        <!-- Main Content -->
        <div class="flex-1 w-full space-y-4">

          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1">
                <Train class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">{{ $t('trip_transport_page.title') }}</h2>
                <p class="text-muted-foreground hidden md:block">{{ $t('trip_transport_page.subtitle') }}</p>
              </div>
            </div>
            <Button @click="handleCreateTransport"><Plus class="h-4 w-4" /> {{ $t('trip_transport_page.actions.add') }}</Button>
          </div>

          <div v-if="transports.length === 0" class=" px-4 md:px-0 text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <Train class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">{{ $t('trip_transports_page.empty.title') }}</h3>
            <p class="max-w-md mx-auto mt-2">{{ $t('trip_transports_page.empty.subtitle') }}</p>
          </div>
          <div v-else class="space-y-8">
            <!-- Passes Section -->
            <div v-if="passes.length > 0">
              <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <div class="bg-primary/10 p-1.5 rounded text-primary">
                  <Train class="h-5 w-5" />
                </div>
                {{ $t('trip_transports_page.sections.passes') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card v-for="t in passes" :key="t.id" class="relative group">
                   <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="icon" class="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm">
                            <span class="sr-only">{{ $t('trips_page.actions.open_menu') }}</span>
                            <MoreVertical class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="handleEditTransport(t)">
                            <Pencil class="mr-2 h-4 w-4" />
                            <span>{{ $t('trips_page.actions.edit') }}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem @click="confirmDelete(t.id)" class="text-destructive focus:text-destructive">
                            <Trash2 class="mr-2 h-4 w-4" />
                            <span>{{ $t('trips_page.actions.delete') }}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                   <CardHeader class="pb-2">
                     <CardTitle class="text-base">{{ t.name }}</CardTitle>
                   </CardHeader>
                   <CardContent class="space-y-4">
                     <div class="flex justify-between items-center text-sm">
                       <span class="text-muted-foreground">{{ $t('trip_transports_page.labels.validity') }}</span>
                       <span class="font-medium">
                         {{ formatDateWithDayShort(t.start_date) }} - {{ formatDateWithDayShort(t.end_date) }}
                       </span>
                     </div>
                     <div class="flex justify-between items-center">
                      <span :class="cn('text-sm font-bold px-2 py-0.5 rounded border uppercase tracking-wide', getPaymentStatusPillClass(t.payment_status || 'pending'))">
                          {{ formatCurrency(t.price || 0, t.currency) }}
                        </span>
                     </div>
                     <div v-if="t.notes" class="mt-2 p-2 bg-yellow-50/50 border border-yellow-100 rounded text-xs text-slate-600">
                        <p class="font-medium text-yellow-700 uppercase mb-0.5">{{ $t('trip_transports_page.labels.notes') }}</p>
                        <p class="whitespace-pre-line">{{ t.notes }}</p>
                     </div>
                     <div v-if="t.attachments" class="flex items-center gap-2 mt-2">
                      <div v-for="item in t.attachments" :key="item.id">
                        <Button 
                          :key="item.id"
                          @click="downloadFile(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)"
                          :title="$t('trip_transports_page.actions.download_prefix') + ': ' + (item.directus_files_id?.filename_download || item.filename_download)"
                          variant="outline" size="sm" class="h-6 px-2 text-xs"
                        >
                          <FileDown class="h-3 w-3 mr-1" /> <span class="truncate max-w-[100px]">{{ item.directus_files_id?.filename_download || item.filename_download }}</span>
                        </Button>
                      </div>
                    </div>
                     <EntityTasksWidget 
                        :trip-id="tripId"
                        entity-type="transport"
                        :entity-id="t.id"
                        :title="$t('trip_transports_page.tasks.title_prefix') + ': ' + (t.name || '')"
                        class="hidden"
                      />
                   </CardContent>
                </Card>
              </div>
            </div>

            <!-- Routes Section -->
            <div v-if="routes.length > 0">
              <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                <div class="bg-primary/10 p-1.5 rounded text-primary">
                  <ArrowRight class="h-5 w-5" />
                </div>
                {{ $t('trip_transports_page.sections.routes') }}
              </h3>
              <div class="space-y-4">
                <Card v-for="t in routes" :key="t.id">
                  <CardHeader class="flex flex-row items-start justify-between pb-2">
                    <div class="flex justify-between w-full">
                      <CardTitle class="text-lg flex items-center gap-2">
                        {{ t.name }}
                        <Badge v-if="t.pass_id" variant="secondary" class="text-xs font-normal">
                          <Train class="h-3 w-3 mr-1" /> {{ $t('trip_transports_page.labels.covered_by_pass') }}
                        </Badge>
                      </CardTitle>
                      <div class="flex items-center gap-2">
                        <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getStatusColor(t.payment_status || 'pending'))">
                          {{ formatCurrency(t.price || 0, t.currency) }}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8 p-0">
                          <span class="sr-only">{{ $t('trips_page.actions.open_menu') }}</span>
                          <MoreVertical class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="handleEditTransport(t)">
                          <Pencil class="mr-2 h-4 w-4" />
                          <span>{{ $t('trips_page.actions.edit') }}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="confirmDelete(t.id)" class="text-destructive focus:text-destructive">
                          <Trash2 class="mr-2 h-4 w-4" />
                          <span>{{ $t('trips_page.actions.delete') }}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div class="space-y-4">
                      <!-- Stops -->
                      <div v-if="t.stops && t.stops.length > 0">
                        <div v-for="(escala, i) in t.stops" :key="i" class="relative pl-6 pb-6 last:pb-0 border-l border-dashed border-slate-300 ml-2">
                          <div class="absolute -left-2.5 top-0 bg-white p-0.5">
                             <component :is="getTransportIcon(escala.type)" class="h-4 w-4 text-slate-500" />
                          </div>
                          
                          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-md">
                            <div class="flex items-center gap-4">
                              <div class="space-y-1">
                                <div class="text-sm font-medium">{{ escala.departure_place }}</div>
                                <div class="text-xs text-muted-foreground">{{ formatTime(escala.departure_time) }}</div>
                              </div>
                              <ArrowRight class="h-4 w-4 text-slate-300" />
                              <div class="space-y-1">
                                <div class="text-sm font-medium">{{ escala.arrival_place }}</div>
                                <div class="text-xs text-muted-foreground">{{ formatTime(escala.arrival_time) }}</div>
                              </div>
                            </div>
                            <div class="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                              {{ $t(`trip_transport_drawer.transport_mode.${escala.type}`) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div v-if="t.notes" class="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm text-slate-600">
                        <p class="font-medium text-yellow-700 text-xs uppercase mb-1">{{ $t('trip_transports_page.labels.notes') }}</p>
                        <p class="whitespace-pre-line">{{ t.notes }}</p>
                      </div>
                      <EntityTasksWidget 
                        :trip-id="tripId"
                        entity-type="transport"
                        :entity-id="t.id"
                        :title="$t('trip_transports_page.tasks.title_prefix') + ': ' + (t.name || '')"
                        class="hidden"
                      />
                      <div v-if="t.attachments" class="flex items-center gap-2 mt-4">
                        <div v-for="item in t.attachments" :key="item.id">
                          <Button 
                            :key="item.id"
                            @click="downloadFile(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)"
                            :title="$t('trip_transports_page.actions.download_prefix') + ': ' + (item.directus_files_id?.filename_download || item.filename_download)"
                          >
                            <FileDown class="h-6 w-6" /> <span class="truncate w-full max-w-[300px]">{{ item.directus_files_id?.filename_download || item.filename_download }}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
  
        </div>

        <!-- Sidebar Tasks -->
        <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
          <TasksSidebar 
            :tasks="allTransportTasks"
            @update:status="(id, status) => updateTask(Number(id), { status })"
            @edit="handleEditTask"
            @add="handleAddTask"
          />
          <div class="bg-neutral-200/75 rounded-2xl overflow-hidden mt-4 h-[80px] w-full flex items-center justify-center">
            &nbsp;
          </div>
        </div>
      </div>

    <TaskModal 
        v-model:open="isTaskModalOpen" 
        :task="selectedTaskToEdit" 
        :trip-id="tripId"
      default-group-id="Transporte"
      default-entity-type="transport"
        @saved="fetchTasks(tripId)"
      />

      <!-- Alert Dialog Confirmación -->
      <AlertDialog v-model:open="isDeleteOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ $t('trip_transport_page.delete.title') }}</AlertDialogTitle>
            <AlertDialogDescription>{{ $t('trip_transport_page.delete.description') }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ $t('trip_transport_page.delete.cancel') }}</AlertDialogCancel>
            <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">{{ $t('trip_transport_page.delete.confirm') }}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <TransportDrawer 
      v-model:open="isModalOpen" 
      :trip-id="tripId" 
      :current-trip="currentTrip" 
      :item-to-edit="itemToEdit" 
      @saved="onSaved"
    />
  </div>
</template>
