<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { Camera, Plus, Trash2, Pencil, Calendar, MapPin, Clock, MoreVertical, FileDown } from 'lucide-vue-next'
  import { useTripOrganization } from '~/composables/useTripOrganization'
  import { useTrips } from '~/composables/useTrips'
  import { useDirectusFiles } from '~/composables/useDirectusFiles'
  import { formatTime, formatDateTime, formatDateWithDayShort } from '~/utils/dates'
  import { formatCurrency } from '~/utils/currency'
  import { cn } from '~/lib/utils'
  import { getStatusColor, getStatusLabel } from '~/utils/trip-status'
  import ActivityDrawer from '~/components/trips/drawers/ActivityDrawer.vue'
  import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'
  import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
  import TaskModal from '~/components/trips/tasks/TaskModal.vue'
  import { useTripTasks } from '~/composables/useTripTasks'
  import { type Task } from '~/types/tasks'
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
  import LocationMap from '~/components/maps/LocationMap.vue'

  definePageMeta({
    layout: 'dashboard'
  })
  const route = useRoute()
  const tripId = route.params.id as string

  const { currentTrip } = useTrips()
  const { actividades, fetchOrganizationData, deleteActividad } = useTripOrganization()
  const { tasks, init: initTasks, updateTask } = useTripTasks()
  const { downloadFile } = useDirectusFiles()

  const isTaskModalOpen = ref(false)
  const selectedTaskToEdit = ref<Task | null>(null)

  const allActivityTasks = computed(() => {
    return tasks.value.filter(t => {
      // Check direct entity type
      if (t.entity_type === 'activity') return true
      
      // Check group entity type if task doesn't have it set directly
      const group = typeof t.task_group === 'object' ? t.task_group : null
      if (group && group.entity_type === 'activity') return true
      
      return false
    })
  })

  const handleEditTask = (task: Task) => {
    selectedTaskToEdit.value = task
    isTaskModalOpen.value = true
  }

  const isModalOpen = ref(false)
  const itemToEdit = ref(null)

  const isDeleteOpen = ref(false)
  const activityToDelete = ref<number | null>(null)

  const confirmDelete = (id: number) => {
    activityToDelete.value = id
    isDeleteOpen.value = true
  }

  const executeDelete = async () => {
    if (activityToDelete.value) {
      await deleteActividad(activityToDelete.value)
      isDeleteOpen.value = false
      activityToDelete.value = null
    }
  }

  const handleCreateActivity = () => {
    itemToEdit.value = null
    isModalOpen.value = true
  }

  const handleEditActivity = (a: any) => {
    itemToEdit.value = a
    isModalOpen.value = true
  }

  const onSaved = () => {
    fetchOrganizationData(tripId)
  }

  onMounted(() => {
    fetchOrganizationData(tripId)
    initTasks(parseInt(tripId))
  })

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return ''
    const d1 = new Date(start)
    const d2 = new Date(end)
    const diffMs = d2.getTime() - d1.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
    return `${minutes}m`
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
              <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mt-1">
                <Camera class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">{{ $t('trip_activities_page.title') }}</h2>
                <p class="text-muted-foreground hidden md:block">{{ $t('trip_activities_page.subtitle') }}</p>
              </div>
            </div>
            <Button @click="handleCreateActivity"><Plus class="h-4 w-4" /> {{ $t('trip_activities_page.actions.add') }}</Button>
          </div>
          <div v-if="actividades.length === 0" class=" px-4 md:px-0 text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <Camera class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">{{ $t('trip_activities_page.empty.title') }}</h3>
            <p class="max-w-md mx-auto mt-2">{{ $t('trip_activities_page.empty.subtitle') }}</p>
          </div>
          <div v-else class="space-y-4">
            <Card v-for="a in actividades" :key="a.id">
              <CardHeader class="flex flex-row items-start justify-between pb-2">
                <div class="flex justify-between w-full">
                  <CardTitle class="text-lg">{{ a.nombre }}</CardTitle>
                  <div class="flex items-center gap-2">
                    <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getStatusColor(a.estado_pago || 'pendiente'))">
                      {{ formatCurrency(a.precio || 0, a.moneda) }}
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
                    <DropdownMenuItem @click="handleEditActivity(a)">
                      <Pencil class="mr-2 h-4 w-4" />
                      <span>{{ $t('trips_page.actions.edit') }}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="confirmDelete(a.id)" class="text-destructive focus:text-destructive">
                      <Trash2 class="mr-2 h-4 w-4" />
                      <span>{{ $t('trips_page.actions.delete') }}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div class="flex flex-col xl:flex-row gap-8 w-full">
                  <div class="w-full xl:w-1/3">
                    <div v-if="a.ubicacion?.latitude && a.ubicacion?.longitude" class="h-[200px] w-full rounded-md overflow-hidden relative">
                      <LocationMap 
                        :latitude="a.ubicacion.latitude" 
                        :longitude="a.ubicacion.longitude"
                      />
                    </div>
                  </div>
                  <div class="w-full xl:w-2/3 flex flex-col justify-between space-y-6">
                    <div class="flex flex-wrap gap-4">
                      <div class="flex items-center gap-2">
                        <Calendar class="h-4 w-4 text-slate-400" />
                        <span class="font-medium">{{ formatDateWithDayShort(a.fecha_inicio) }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock class="h-4 w-4 text-slate-400" />
                        <span>{{ formatTime(a.fecha_inicio) }} - {{ formatTime(a.fecha_fin) }}</span>
                        <Badge variant="secondary" class="ml-1 text-[10px]">{{ getDuration(a.fecha_inicio, a.fecha_fin) }}</Badge>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin class="h-3 w-3" />
                      <span v-if="a.ubicacion?.address">{{ a.ubicacion.address }}</span>
                      <span v-else class="italic">{{ $t('trip_activities_page.location.none') }}</span>
                    </div>

                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center justify-start gap-1">
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.ubicacion?.address">
                          <NuxtLink :href="a.enlace_google" target="_blank"> 
                            <span class="sr-only">{{ $t('trip_activities_page.actions.open_maps') }}</span>
                            <MapPin class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                        <!--
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.telefono">
                          <NuxtLink v-if="a.telefono" :title="`Llamar: ${a.telefono}`" :href="`tel:${a.telefono}`"> 
                            <span class="sr-only">Llamar</span>
                            <PhoneCall class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.email">
                          <NuxtLink v-if="a.email" :title="`Enviar correo: ${a.email}`" :href="`mailto:${a.email}`"> 
                            <span class="sr-only">Enviar correo</span>
                            <Mail class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                        -->
                      </div>
                      <div class="flex items-center justify-end gap-2">
                        aaa
                      </div>
                    </div>


                  </div>



                </div>
                <div v-if="a.notas" class="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm text-slate-600">
                  <p class="font-medium text-yellow-700 text-xs uppercase mb-1">{{ $t('trip_activities_page.labels.notes') }}</p>
                  <p class="whitespace-pre-line">{{ a.notas }}</p>
                </div>
                <EntityTasksWidget 
                  :trip-id="parseInt(tripId)"
                  entity-type="activity"
                  :entity-id="a.id"
                  :title="$t('trip_activities_page.tasks.title_prefix') + ': ' + (a.nombre || '')"
                  class="hidden"
                />
                <div v-if="a.adjuntos" class="flex items-center gap-2 mt-4">
                  <div v-for="item in a.adjuntos" :key="item.id">
                    <Button 
                      :key="item.id"
                      @click="downloadFile(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)"
                      :title="$t('trip_activities_page.actions.download_prefix') + ': ' + (item.directus_files_id?.filename_download || item.filename_download)"
                    >
                      <FileDown class="h-6 w-6" /> <span class="truncate w-full max-w-[300px]">{{ item.directus_files_id?.filename_download || item.filename_download }}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <!-- Sidebar Tasks -->
        <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
          <TasksSidebar 
            :tasks="allActivityTasks"
            @update:status="(id, status) => updateTask(id, { status })"
            @edit="handleEditTask"
          />
          <div class="bg-gray-200/75 rounded-2xl overflow-hidden mt-4 h-[80px] w-full flex items-center justify-center">
            &nbsp;
          </div>
        </div>
      </div>
    </div>

    <ActivityDrawer 
      v-model:open="isModalOpen" 
      :trip-id="tripId" 
      :current-trip="currentTrip" 
      :item-to-edit="itemToEdit" 
      @saved="onSaved"
    />

    <TaskModal 
      v-model:open="isTaskModalOpen" 
      :task="selectedTaskToEdit" 
      :trip-id="parseInt(tripId)"
      @saved="initTasks(parseInt(tripId))"
    />

    <!-- Alert Dialog Confirmación -->
    <AlertDialog v-model:open="isDeleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('trip_activities_page.delete.title') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ $t('trip_activities_page.delete.description') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ $t('trip_activities_page.delete.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">{{ $t('trip_activities_page.delete.confirm') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  </div>
</template>
