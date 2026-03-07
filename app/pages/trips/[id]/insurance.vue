<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { Shield, Plus, Trash2, Pencil, Phone, MoreVertical, FileDown, PhoneCall, Mail, Calendar, FileText } from 'lucide-vue-next'
  import { useTripOrganizationNew } from '~/composables/useTripOrganizationNew'
  import { useTripsNew } from '~/composables/useTripsNew'
  import { useDirectusFiles } from '~/composables/useDirectusFiles'
  import { formatCurrency } from '~/utils/currency'
  import { formatPhoneNumber, formatPhoneForHref } from '~/utils/phone'
  import { cn } from '~/lib/utils'
  import { getPaymentStatusPillClass } from '~/utils/payment-status'
  import InsuranceDrawer from '~/components/trips/drawers/InsuranceDrawer.vue'
  import TasksSidebar from '~/components/trips/tasks/TasksSidebar.vue'
  import TaskModal from '~/components/trips/tasks/TaskModal.vue'
  import { useTripTasksNew } from '~/composables/useTripTasksNew'
  import { type Task } from '~/types/tasks'
  import { Badge } from '~/components/ui/badge'
  import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
  import { Button } from '~/components/ui/button'
  import { formatDateWithDayShort, getDurationDays } from '~/utils/dates'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

  const route = useRoute()
  const tripId = route.params.id as string

  const { currentTrip } = useTripsNew()
  const { downloadFile } = useDirectusFiles()
  const { insurances, fetchOrganizationData, deleteInsurance } = useTripOrganizationNew()
  const { tasks, fetchTasks, updateTask } = useTripTasksNew()

  const isTaskModalOpen = ref(false)
  const selectedTaskToEdit = ref<Task | null>(null)

  const allInsuranceTasks = computed(() => {
    return tasks.value.filter(t => {
      // Check direct entity type
      if (t.entity_type === 'insurance') return true
      
      // Check group entity type if task doesn't have it set directly
      const group = typeof t.task_group === 'object' ? t.task_group : null
      if (group && group.entity_type === 'insurance') return true
      
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
  const insuranceToDelete = ref<number | null>(null)

  const confirmDelete = (id: number) => {
    insuranceToDelete.value = id
    isDeleteOpen.value = true
  }

  const executeDelete = async () => {
    if (insuranceToDelete.value) {
      await deleteInsurance(insuranceToDelete.value)
      isDeleteOpen.value = false
      insuranceToDelete.value = null
    }
  }

  const handleCreateInsurance = () => {
    itemToEdit.value = null
    isModalOpen.value = true
  }

  const handleEditInsurance = (s: any) => {
    itemToEdit.value = s
    isModalOpen.value = true
  }

  const onSaved = () => {
    fetchOrganizationData(tripId)
  }

  onMounted(() => {
    fetchOrganizationData(tripId)
    fetchTasks(tripId)
  })

  definePageMeta({
    layout: 'dashboard'
  })
</script>

<template>
  <div>
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row gap-8 items-start relative">
        <!-- Main Content -->
        <div class="flex-1 w-full space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-1">
                <Shield class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">{{ $t('trip_insurance_page.title') }}</h2>
                <p class="text-muted-foreground hidden md:block">{{ $t('trip_insurance_page.subtitle') }}</p>
              </div>
            </div>
            <Button @click="handleCreateInsurance"><Plus class="h-4 w-4" /> {{ $t('trip_insurance_page.actions.add') }}</Button>
          </div>
          <div v-if="insurances.length === 0" class="text-center py-16 border rounded-lg bg-slate-50 border-dashed text-muted-foreground">
            <Shield class="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 class="text-lg font-semibold text-slate-700">{{ $t('trip_insurance_page.empty.title') }}</h3>
            <p class="max-w-md mx-auto mt-2">{{ $t('trip_insurance_page.empty.subtitle') }}</p>
          </div>
          <div v-else class="space-y-4">
            <Card v-for="s in insurances" :key="s.id">
              <CardHeader class="flex flex-row items-start justify-between pb-2">
                <div class="flex justify-between w-full">
                  <CardTitle class="text-lg">{{ s.provider }}</CardTitle>
                  <div class="flex items-center gap-2">
                    <span :class="cn('text-base font-bold px-1.5 pt-0.5 pb-0 rounded border uppercase tracking-wide', getPaymentStatusPillClass(s.payment_status || 'pending'))">
                      {{ formatCurrency(s.price || 0, s.currency) }}
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
                    <DropdownMenuItem @click="handleEditInsurance(s)">
                      <Pencil class="mr-2 h-4 w-4" />
                      <span>{{ $t('trips_page.actions.edit') }}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="confirmDelete(s.id)" class="text-destructive focus:text-destructive">
                      <Trash2 class="mr-2 h-4 w-4" />
                      <span>{{ $t('trips_page.actions.delete') }}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div class="flex flex-col xl:flex-row gap-8 w-full">
                  <div class="w-full xl:w-2/3 flex flex-col justify-between space-y-6">
                    <div class="flex flex-wrap gap-4">
                      <div class="flex items-center gap-2">
                        <Calendar class="h-4 w-4 text-slate-400" />
                        <span class="font-medium">
                          {{ formatDateWithDayShort(s.start_date) }} - {{ formatDateWithDayShort(s.end_date) }}
                        </span>
                        <Badge variant="secondary" class="ml-1 text-[10px]">{{ getDurationDays(s.start_date, s.end_date) }} {{ $t('trip_insurance_page.labels.days') }}</Badge>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-muted-foreground">
                         <FileText class="h-4 w-4 text-slate-400" />
                         <span>{{ $t('trip_insurance_page.labels.policy') }}: </span>
                         <span class="font-mono font-medium text-slate-700">{{ s.policy_number }}</span>
                      </div>
                    </div>

                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center justify-start gap-3">
                         <div v-if="s.emergency_phone" class="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-md border border-red-100">
                            <Phone class="h-4 w-4" />
                            <a :href="`tel:${s.emergency_phone}`" class="font-bold hover:underline">{{ s.emergency_phone }}</a>
                         </div>
                         <div v-if="s.emergency_email" class="flex items-center gap-2 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md border border-slate-100">
                            <Mail class="h-4 w-4" />
                            <a :href="`mailto:${s.emergency_email}`" class="font-medium hover:underline">{{ s.emergency_email }}</a>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="s.notes" class="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm text-slate-600">
                  <p class="font-medium text-yellow-700 text-xs uppercase mb-1">{{ $t('trip_insurance_page.labels.notes') }}</p>
                  <p class="whitespace-pre-line">{{ s.notes }}</p>
                </div>
                <div v-if="s.attachments" class="flex items-center gap-2 mt-4">
                  <div v-for="item in s.attachments" :key="item.id">
                    <Button 
                      :key="item.id"
                      @click="downloadFile(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)"
                      :title="$t('trip_insurance_page.actions.download_prefix') + ': ' + (item.directus_files_id?.filename_download || item.filename_download)"
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
            :tasks="allInsuranceTasks"
            @update:status="(id, status) => updateTask(id, { status })"
            @edit="handleEditTask"
            @add="handleAddTask"
          />
          <div class="bg-gray-200/75 rounded-2xl overflow-hidden mt-4 h-[80px] w-full flex items-center justify-center">
            &nbsp;
          </div>
        </div>
      </div>

      <TaskModal 
        v-model:open="isTaskModalOpen" 
        :task="selectedTaskToEdit" 
        :trip-id="tripId"
      default-group-id="Seguros"
      default-entity-type="insurance"
        @saved="fetchTasks(tripId)"
      />
      <!-- Alert Dialog Confirmación -->
      <AlertDialog v-model:open="isDeleteOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ $t('trip_insurance_page.delete.title') }}</AlertDialogTitle>
            <AlertDialogDescription>{{ $t('trip_insurance_page.delete.description') }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ $t('trip_insurance_page.delete.cancel') }}</AlertDialogCancel>
            <AlertDialogAction @click="executeDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">{{ $t('trip_insurance_page.delete.confirm') }}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    <InsuranceDrawer 
      v-model:open="isModalOpen" 
      :trip-id="tripId" 
      :current-trip="currentTrip" 
      :item-to-edit="itemToEdit" 
      @saved="onSaved"
    />
  </div>
</template>
