<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { BedDouble, Plus, Trash2, Pencil, Calendar, MapPin, MoreVertical, PhoneCall, Mail, BaggageClaim, Bath, Coffee, Utensils, BedSingle, FileDown } from 'lucide-vue-next'
  import { useTripOrganizationNew } from '~/composables/useTripOrganizationNew'
  import { useTripsNew } from '~/composables/useTripsNew'
  import { useDirectusFiles } from '~/composables/useDirectusFiles'
  import { formatDateTime, formatDate, getDaysElapsed, formatDateWithDayShort, formatTime } from '~/utils/dates'
  import { formatCurrency } from '~/utils/currency'
  import { cn } from '~/lib/utils'
  import { getPaymentStatusPillClass } from '~/utils/payment-status'
  import { Button } from '~/components/ui/button'
  import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
  import { Badge } from '~/components/ui/badge'
  import AccommodationDrawer from '~/components/trips/drawers/AccommodationDrawer.vue'
  import LocationMap from '~/components/maps/LocationMap.vue'
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from '~/components/ui/tooltip'
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
  import UserAvatar from '~/components/common/UserAvatar.vue'
  import { useTripTasksNew } from '~/composables/useTripTasksNew'
  import TaskModal from '~/components/trips/tasks/TaskModal.vue'
  import EntityTasksWidget from '~/components/trips/tasks/EntityTasksWidget.vue'
  import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
  import { type Task } from '~/types/directus'
  
  definePageMeta({
    layout: 'dashboard'
  })
  const route = useRoute()
  const tripId = parseInt(route.params.id as string)

  const { currentTrip } = useTripsNew()
  const { accommodations, fetchOrganizationData, deleteAccommodation } = useTripOrganizationNew()
  const { tasks, fetchTasks, updateTask } = useTripTasksNew()
  const { downloadFile } = useDirectusFiles()

  const isTaskModalOpen = ref(false)
  const selectedTaskToEdit = ref<Task | null>(null)

  const allAccommodationTasks = computed(() => {
    return tasks.value.filter(t => {
      // Check direct entity type
      if (t.entity_type === 'accommodation' || t.entity_type === 'accommodations') return true
      // Check group entity type if task doesn't have it set directly
      if (!t.entity_type && t.task_group === 'Alojamientos') return true
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
  const accommodationToDelete = ref<number | null>(null)

  const confirmDelete = (id: number) => {
    accommodationToDelete.value = id
    isDeleteOpen.value = true
  }

  const executeDelete = async () => {
    if (accommodationToDelete.value) {
      await deleteAccommodation(accommodationToDelete.value)
      isDeleteOpen.value = false
      accommodationToDelete.value = null
    }
  }

  const handleCreateAccommodation = () => {
    itemToEdit.value = null
    isModalOpen.value = true
  }

  const handleEditAccommodation = (a: any) => {
    itemToEdit.value = a
    isModalOpen.value = true
  }

  const onSaved = () => {
    fetchOrganizationData(tripId)
  }

  onMounted(() => {
    fetchOrganizationData(tripId)
    fetchTasks(tripId)
  })

  const getNights = (start: string, end: string) => {
    if (!start || !end) return 0
    const d1 = new Date(start)
    const d2 = new Date(end)
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  }

  const knownRoomTypes = new Set(['single', 'double', 'triple', 'twin', 'quadruple', 'shared'])

  const normalizeRooms = (a: any) => {
    const rooms = Array.isArray(a?.rooms) ? a.rooms : []
    if (rooms.length > 0) return rooms
    if (a?.room_type || a?.room_count || a?.board_basis || a?.is_private) {
      return [
        {
          room_type: a.room_type ? a.room_type : 'unknown',
          room_count: a.room_count ?? 1,
          is_private_bath: Boolean(a.is_private),
          board_basis: Array.isArray(a.board_basis) ? a.board_basis : []
        }
      ]
    }
    return []
  }

  const getRoomTypeKey = (roomType?: string | null) => {
    const normalized = String(roomType || '').trim()
    if (!normalized) return null
    if (!knownRoomTypes.has(normalized)) return null
    return `accommodation_page.room.types.${normalized}`
  }

  const getRoomTotalCount = (a: any) => {
    const rooms = normalizeRooms(a)
    return rooms.reduce((acc: number, r: any) => acc + (Number(r.room_count) || 0), 0)
  }

  const getRoomGroups = (a: any) => {
    const rooms = normalizeRooms(a)
    const map = new Map<string, number>()
    rooms.forEach((r: any) => {
      const type = String(r.room_type || '').trim() || 'unknown'
      const count = Number(r.room_count) || 0
      map.set(type, (map.get(type) || 0) + count)
    })
    return Array.from(map.entries())
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ type, count }))
  }

  const getBoardBasisSet = (a: any) => {
    const rooms = normalizeRooms(a)
    const set = new Set<string>()
    rooms.forEach((r: any) => {
      if (Array.isArray(r.board_basis)) {
        r.board_basis.forEach((v: any) => {
          if (v) set.add(String(v))
        })
      }
    })
    return set
  }

  const hasPrivateBath = (a: any) => {
    const rooms = normalizeRooms(a)
    return rooms.some((r: any) => Boolean(r.is_private_bath))
  }
</script>

<template>
  <div>
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8">
      <div class="flex flex-col lg:flex-row gap-8 items-start relative">
        
        <!-- Main Content -->
        <div class="flex-1 w-full space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-1">
                <BedDouble class="h-5 w-5" />
              </div>
              <h2 class="text-2xl font-bold tracking-tight">{{ $t('accommodation_page.title') }}</h2>
            </div>
            <Button @click="handleCreateAccommodation"><Plus class="h-4 w-4" /> {{ $t('accommodation_page.actions.add') }}</Button>
          </div>
          <div v-if="accommodations.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <BedDouble class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">{{ $t('accommodation_page.empty.title') }}</h3>
            <p class="max-w-md mx-auto mt-2">{{ $t('accommodation_page.empty.subtitle') }}</p>
          </div>
          <template v-else>
            <Card v-for="a in accommodations" :key="a.id">
              <CardHeader class="flex flex-row items-start justify-between gap-4">
                <div class="flex justify-between w-full">
                  <CardTitle class="text-lg">{{ a.name }}</CardTitle>
                  <div class="flex items-center gap-2">
                    <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getPaymentStatusPillClass(a.payment_status || 'pending'))">
                      {{ formatCurrency(a.price || 0, a.currency) }}
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
                    <DropdownMenuItem @click="handleEditAccommodation(a)">
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
                    <div v-if="a.latitude && a.longitude" class="h-[200px] w-full rounded-md overflow-hidden relative">
                      <LocationMap 
                        :latitude="a.latitude" 
                        :longitude="a.longitude"
                      />
                    </div>
                  </div>
                  <div class="w-full xl:w-2/3 flex flex-col justify-between space-y-6">
                    <div class="flex justify-between gap-4">
                      <div class="space-y-1">
                        <div class="text-xs font-bold text-slate-500 uppercase">{{ $t('accommodation_page.labels.check_in') }}</div>
                        <div class="flex items-center gap-2">
                          <span class="font-medium">{{ formatDateWithDayShort(a.check_in) }}</span>
                          <Badge variant="outline" class="font-mono text-xs">{{ formatTime(a.check_in) }}</Badge>
                        </div>
                      </div>
                      <div class="space-y-1">
                        <div class="text-xs font-bold text-slate-500 uppercase">{{ $t('accommodation_page.labels.check_out') }}</div>
                        <div class="flex items-center gap-2">
                          <span class="font-medium">{{ formatDateWithDayShort(a.check_out) }}</span>
                          <Badge variant="outline" class="font-mono text-xs">{{ formatTime(a.check_out) }}</Badge>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <BedSingle class="h-4 w-4 text-slate-400" />
                      <span v-if="getRoomGroups(a).length">
                        {{ $tc('accommodation_page.room.count', { count: getRoomTotalCount(a) }) }}
                        <template v-for="(g, idx) in getRoomGroups(a)" :key="g.type">
                          <template v-if="idx === 0"> • </template>
                          <template v-else> • </template>
                          {{ g.count }}×
                          <template v-if="getRoomTypeKey(g.type)">
                            {{ $t(getRoomTypeKey(g.type) as string) }}
                          </template>
                          <template v-else-if="g.type === 'unknown'">
                            {{ $t('accommodation_page.room.unknown') }}
                          </template>
                          <template v-else>
                            {{ g.type }}
                          </template>
                        </template>
                      </span>
                      <span v-else>
                        {{ $t('accommodation_page.room.single') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center justify-start gap-1">
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.address">
                          <NuxtLink :href="a.google_maps_link" target="_blank"> 
                            <span class="sr-only">{{ $t('accommodation_page.actions.open_maps') }}</span>
                            <MapPin class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.phone">
                          <NuxtLink v-if="a.phone" :title="`${$t('accommodation_page.actions.call_prefix')} ${a.phone}`" :href="`tel:${a.phone}`"> 
                            <span class="sr-only">{{ $t('accommodation_page.actions.call') }}</span>
                            <PhoneCall class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                        <Button size="icon" as-child class="h-8 w-8 p-0" v-if="a.email">
                          <NuxtLink v-if="a.email" :title="`${$t('accommodation_page.actions.email_prefix')} ${a.email}`" :href="`mailto:${a.email}`"> 
                            <span class="sr-only">{{ $t('accommodation_page.actions.email') }}</span>
                            <Mail class="h-6 w-6" />
                          </NuxtLink>
                        </Button>
                      </div>
                      <div class="flex items-center justify-end gap-2">
                        <TooltipProvider v-if="a.has_luggage_forwarding">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <div class="p-2">
                                <BaggageClaim class="h-5 w-5 text-neutral-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{{ $t('accommodation_page.features.luggage_transfer') }}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider v-if="hasPrivateBath(a)">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <div class="p-2">
                                <Bath class="h-5 w-5 text-neutral-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{{ $t('accommodation_page.features.private_bath') }}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider v-if="getBoardBasisSet(a).has('breakfast') || getBoardBasisSet(a).has('half_board') || getBoardBasisSet(a).has('full_board')">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <div class="p-2 flex items-center gap-6">
                                <Coffee v-if="getBoardBasisSet(a).has('breakfast')" class="h-5 w-5 text-neutral-500" />
                                <Utensils v-if="getBoardBasisSet(a).has('half_board') || getBoardBasisSet(a).has('full_board')" class="h-5 w-5 text-neutral-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p class="flex gap-2">
                                <span v-if="getBoardBasisSet(a).has('breakfast')">{{ $t('accommodation_page.meals.breakfast') }}</span>
                                <span v-if="getBoardBasisSet(a).has('half_board')">{{ $t('accommodation_page.meals.half_board') }}</span>
                                <span v-if="getBoardBasisSet(a).has('full_board')">{{ $t('accommodation_page.meals.full_board') }}</span>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="a.notes" class="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm text-slate-600">
                  <p class="font-medium text-yellow-700 text-xs uppercase mb-1">{{ $t('accommodation_page.labels.notes') }}</p>
                  <p class="whitespace-pre-line">{{ a.notes }}</p>
                </div>
                <EntityTasksWidget 
                  :trip-id="tripId"
                  entity-type="accommodation"
                  :entity-id="a.id"
                  :title="$t('accommodation_page.tasks.title_prefix') + ': ' + (a.name || $t('accommodation_page.title'))"
                  class="hidden"
                />
                <div v-if="Array.isArray(a.attachments) && a.attachments.length" class="flex items-center gap-2 mt-4">
                  <div v-for="item in (a.attachments as any[])" :key="item.id">
                    <Button 
                      :key="item.id"
                      @click="downloadFile(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)"
                      :title="$t('accommodation_page.actions.download_prefix') + ': ' + (item.directus_files_id?.filename_download || item.filename_download)"
                    >
                      <FileDown class="h-6 w-6" /> <span class="truncate w-full max-w-[300px]">{{ item.directus_files_id?.filename_download || item.filename_download }}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </template>
        </div>

        <!-- Sidebar Tasks -->
        <div class="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8">
          <TasksSidebar 
            :tasks="allAccommodationTasks"
            @update:status="(id, status) => updateTask(Number(id), { status })"
            @edit="handleEditTask"
            @add="handleAddTask"
          />
          <div class="bg-neutral-200/75 rounded-2xl overflow-hidden mt-4 h-[80px] w-full flex items-center justify-center">
            &nbsp;
          </div>
        </div>

      </div>
    </div>

    <TaskModal 
      v-model:open="isTaskModalOpen" 
      :task="selectedTaskToEdit" 
      :trip-id="tripId"
      default-group-id="Alojamientos"
      default-entity-type="accommodation"
      @saved="fetchTasks(tripId)"
    />

    <!-- Alert Dialog Confirmación -->
    <AlertDialog v-model:open="isDeleteOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ $t('accommodation_page.delete.title') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ $t('accommodation_page.delete.description') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ $t('accommodation_page.delete.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">{{ $t('accommodation_page.delete.confirm') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AccommodationDrawer 
      v-model:open="isModalOpen" 
      :trip-id="tripId" 
      :current-trip="currentTrip" 
      :item-to-edit="itemToEdit" 
      @saved="onSaved"
    />
  </div>
</template>
