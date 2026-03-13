<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTripOrganizationNew } from '~/composables/useTripOrganizationNew'
import type { Accommodation } from '~/types/directus'
import { useTripItemForm } from '~/composables/useTripItemForm'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter,
  DrawerDescription 
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { DateTimePicker } from '~/components/ui/date-time-picker'
import LocationSelector from '~/components/ui/LocationSelector/LocationSelector.vue'
import CurrencySelector from '~/components/ui/CurrencySelector/CurrencySelector.vue'
import FileUploader from '~/components/ui/FileUploader/FileUploader.vue'
import FileList from '~/components/ui/FileList/FileList.vue'
import { useDirectusRepo } from '~/composables/useDirectusRepo'
import { readItem } from '@directus/sdk'
import { Plus, Trash2 } from 'lucide-vue-next'
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

const props = defineProps<{
  open: boolean
  tripId: string | number
  currentTrip?: any
  itemToEdit?: any
}>()

const emit = defineEmits(['update:open', 'saved'])
const { t } = useI18n()

const { createAccommodation, updateAccommodation } = useTripOrganizationNew()
const { getClient } = useDirectusRepo()

// Initialize generic form logic
const { 
  formData, 
  resetForm,
  handleCreate, 
  handleEdit, 
  handleSave 
} = useTripItemForm<Partial<Accommodation>>(
  () => ({ 
    currency: props.currentTrip?.currency || 'JPY', 
    price: 0, 
    payment_status: 'pending', 
    notes: '', 
    has_luggage_forwarding: false,
    phone: '',
    email: '',
    google_maps_link: '',
    attachments: [],
    rooms: [
      {
        room_type: 'single',
        room_count: 1,
        is_private_bath: false,
        board_basis: []
      }
    ]
  }),
  createAccommodation,
  updateAccommodation,
  String(t('trip_accommodation_drawer.item_label'))
)

const pensionOptions = [
  { value: 'breakfast', labelKey: 'trip_accommodation_drawer.pension.breakfast' },
  { value: 'half_board', labelKey: 'trip_accommodation_drawer.pension.half_board' },
  { value: 'full_board', labelKey: 'trip_accommodation_drawer.pension.full_board' },
  { value: 'none', labelKey: 'trip_accommodation_drawer.pension.none' },
]

const roomTypeOptions = [
  { value: 'single', labelKey: 'trip_accommodation_drawer.room_types.single' },
  { value: 'double', labelKey: 'trip_accommodation_drawer.room_types.double' },
  { value: 'triple', labelKey: 'trip_accommodation_drawer.room_types.triple' },
  { value: 'twin', labelKey: 'trip_accommodation_drawer.room_types.twin' },
  { value: 'quadruple', labelKey: 'trip_accommodation_drawer.room_types.quadruple' },
  { value: 'shared', labelKey: 'trip_accommodation_drawer.room_types.shared' },
]

const updateRoomPension = (roomIndex: number, value: string, event: Event) => {
  const isChecked = (event.target as HTMLInputElement).checked
  const rooms = (((formData.value as any).rooms || []) as any[])
  const room = rooms[roomIndex]
  if (!room) return
  const current = new Set(room.board_basis || [])
  
  if (isChecked) current.add(value)
  else current.delete(value)
  
  room.board_basis = Array.from(current)
}

const addRoom = () => {
  const rooms = (((formData.value as any).rooms || []) as any[])
  rooms.push({
    room_type: 'single',
    room_count: 1,
    is_private_bath: false,
    board_basis: []
  })
  ;(formData.value as any).rooms = rooms
}

const removeRoom = (roomIndex: number) => {
  const rooms = (((formData.value as any).rooms || []) as any[])
  if (rooms.length <= 1) return
  rooms.splice(roomIndex, 1)
  ;(formData.value as any).rooms = rooms
}

const ensureRooms = () => {
  const rooms = (((formData.value as any).rooms || []) as any[])
  if (rooms.length > 0) {
    rooms.forEach((r) => {
      if (!Array.isArray(r.board_basis)) r.board_basis = []
      if (r.room_count === undefined || r.room_count === null) r.room_count = 1
      if (!r.room_type) r.room_type = 'single'
      if (r.is_private_bath === undefined || r.is_private_bath === null) r.is_private_bath = false
    })
    ;(formData.value as any).rooms = rooms
    return
  }

  const legacyRoomType = (formData.value as any).room_type || 'single'
  const legacyRoomCount = (formData.value as any).room_count ?? 1
  const legacyPrivate = Boolean((formData.value as any).is_private)
  const legacyBoard = Array.isArray((formData.value as any).board_basis) ? (formData.value as any).board_basis : []

  ;(formData.value as any).rooms = [
    {
      room_type: legacyRoomType,
      room_count: legacyRoomCount,
      is_private_bath: legacyPrivate,
      board_basis: legacyBoard
    }
  ]
}

// Sync open state
const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const roomsList = computed(() => (((formData.value as any).rooms || []) as any[]))

// Watch for edit item changes
watch(() => props.itemToEdit, (newItem) => {
  if (newItem) {
    handleEdit(newItem)
    ensureRooms()
  } else {
    handleCreate()
    ensureRooms()
  }
}, { immediate: true })

watch(isOpen, (isOpened) => {
  if (isOpened && !props.itemToEdit) {
    handleCreate()
    ensureRooms()
  }
})

const normalizeRoomCount = (val: any) => {
  if (typeof val === 'number') return Number.isFinite(val) ? val : null
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const computeAccommodationFromRooms = (rooms: any[]) => {
  const board = new Set<string>()
  let totalCount = 0
  let hasPrivate = false
  const types = new Set<string>()

  rooms.forEach((r) => {
    const count = normalizeRoomCount(r.room_count) ?? 0
    totalCount += count
    if (r.room_type) types.add(String(r.room_type))
    if (r.is_private_bath) hasPrivate = true
    if (Array.isArray(r.board_basis)) {
      r.board_basis.forEach((v: any) => {
        if (v) board.add(String(v))
      })
    }
  })

  return {
    totalCount,
    roomType: types.size === 1 ? Array.from(types)[0] : null,
    hasPrivate,
    boardBasis: Array.from(board)
  }
}

const saveAccommodation = async () => {
  ensureRooms()
  const result = await handleSave((data) => {
    ;(data as any).trip_id = typeof props.tripId === 'string' ? parseInt(props.tripId) : props.tripId
    const rooms = (((data as any).rooms || []) as any[]).map(r => ({
      ...r,
      room_count: normalizeRoomCount(r.room_count) ?? 1,
      board_basis: Array.isArray(r.board_basis) ? r.board_basis : []
    }))

    const computed = computeAccommodationFromRooms(rooms)
    ;(data as any).room_count = computed.totalCount
    ;(data as any).room_type = computed.roomType
    ;(data as any).is_private = computed.hasPrivate
    ;(data as any).board_basis = computed.boardBasis

    ;(data as any).rooms = rooms
    return data
  }, undefined, { resetOnSuccess: false })

  if (!result?.id) return
  resetForm()
  emit('saved')
  emit('update:open', false)
}

const isValid = computed(() => {
  if (!formData.value.name) return false
  if (!formData.value.check_in) return false
  if (!formData.value.check_out) return false
  const rooms = (((formData.value as any).rooms || []) as any[])
  if (rooms.length === 0) return false
  if (rooms.some(r => (normalizeRoomCount(r.room_count) ?? 0) <= 0)) return false
  return true
})

const formId = computed(() => (formData.value as any).id)
const formAdjuntos = computed(() => (formData.value as any).attachments || [])

const onFileUploaded = async () => {
  // @ts-ignore
  if (!formData.value.id) return
  
  try {
    const client = await getClient()
    // @ts-ignore
    const response = await client.request(readItem('accommodations', formData.value.id, {
      fields: ['attachments.directus_files_id.*']
    }))
    
    // Update attachments in form data
    // @ts-ignore
    if (response && response.attachments) {
       // @ts-ignore
       formData.value.attachments = response.attachments
    }
  } catch (e) {
    console.error('Error refreshing attachments:', e)
  }
}

// Location Helper
const locationProxy = computed({
  get: () => ({
    address: formData.value.address,
    city: formData.value.city,
    prefecture: formData.value.prefecture,
    latitude: formData.value.latitude,
    longitude: formData.value.longitude
  }),
  set: (val: any) => {
    formData.value.address = val.address
    formData.value.city = val.city
    formData.value.prefecture = val.prefecture
    formData.value.latitude = val.latitude
    formData.value.longitude = val.longitude
  }
})
</script>

<template>
  <Drawer v-model:open="isOpen">
    <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl">
      <DrawerHeader class="w-full max-w-7xl mx-auto px-4">
        <DrawerTitle>{{ formData.id ? $t('trip_accommodation_drawer.title.edit') : $t('trip_accommodation_drawer.title.new') }}</DrawerTitle>
      </DrawerHeader>
      <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
        <div class="max-w-7xl mx-auto flex gap-16 flex-col lg:flex-row px-4">
          <div class="w-full lg:w-2/3 space-y-4 py-4">
            <div>
              <Label>{{ $t('trip_accommodation_drawer.fields.name') }}</Label>
              <Input v-model="formData.name" :placeholder="String($t('trip_accommodation_drawer.placeholders.name'))" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <Label>{{ $t('trip_accommodation_drawer.fields.check_in') }}</Label>
                <DateTimePicker 
                  v-model="formData.check_in" 
                  :min="currentTrip?.start_date || undefined"
                  :max="currentTrip?.end_date || undefined"
                  default-time="15:00"
                />
              </div>
              <div>
                <Label>{{ $t('trip_accommodation_drawer.fields.check_out') }}</Label>
                <DateTimePicker 
                  v-model="formData.check_out" 
                  :min="currentTrip?.start_date || undefined"
                  :max="currentTrip?.end_date || undefined"
                  default-time="11:00"
                />
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <Label>{{ $t('trip_accommodation_drawer.fields.rooms') }}</Label>
                <Button variant="outline" size="sm" @click="addRoom">
                  <Plus class="h-4 w-4" />
                  {{ $t('trip_accommodation_drawer.actions.add_room') }}
                </Button>
              </div>
              <div class="space-y-3">
                <div v-for="(r, idx) in roomsList" :key="r.id || idx" class="border rounded-lg p-3 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="text-sm font-medium">
                      {{ $t('trip_accommodation_drawer.rooms.item_title') }} {{ idx + 1 }}
                    </div>
                    <Button variant="ghost" size="icon" class="h-8 w-8" :disabled="roomsList.length <= 1" @click="removeRoom(idx)">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <Label>{{ $t('trip_accommodation_drawer.rooms.fields.room_count') }}</Label>
                      <Input
                        type="number"
                        min="1"
                        v-model="r.room_count"
                        :placeholder="String($t('trip_accommodation_drawer.rooms.placeholders.room_count'))"
                      />
                    </div>
                    <div>
                      <Label>{{ $t('trip_accommodation_drawer.rooms.fields.room_type') }}</Label>
                      <Select v-model="r.room_type">
                        <SelectTrigger><SelectValue :placeholder="String($t('trip_accommodation_drawer.rooms.placeholders.room_type'))" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="opt in roomTypeOptions" :key="opt.value" :value="opt.value">{{ $t(opt.labelKey) }}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <Switch v-model="r.is_private_bath" :id="`private-bath-${idx}`" />
                    <Label :for="`private-bath-${idx}`">{{ $t('trip_accommodation_drawer.rooms.fields.private_bath') }}</Label>
                  </div>

                  <div>
                    <Label class="mb-2 block">{{ $t('trip_accommodation_drawer.fields.pension') }}</Label>
                    <div class="flex flex-wrap gap-4">
                      <div v-for="opt in pensionOptions" :key="opt.value" class="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          :id="`room-${idx}-pension-native-${opt.value}`"
                          :checked="(r.board_basis || []).includes(opt.value)"
                          @change="updateRoomPension(idx, opt.value, $event)"
                          class="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                        />
                        <Label :for="`room-${idx}-pension-native-${opt.value}`" class="cursor-pointer">{{ $t(opt.labelKey) }}</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label>{{ $t('trip_accommodation_drawer.fields.location') }}</Label>
              <LocationSelector 
                v-model="locationProxy" 
                :placeholder="String($t('trip_accommodation_drawer.placeholders.location'))"
              />
            </div>
            <div class="grid grid-cols-[2fr_1fr_1fr] gap-3">
              <div>
                <Label>{{ $t('trip_accommodation_drawer.fields.total_price') }}</Label>
                <Input 
                  type="number" 
                  v-model="formData.price" 
                  :step="formData.currency === 'JPY' ? '1' : '0.01'" 
                />
              </div>
              <div>
                <Label>{{ $t('trip_accommodation_drawer.fields.currency') }}</Label>
                <CurrencySelector v-model="formData.currency" />
              </div>
              <div>
                <Label>{{ $t('trip_accommodation_drawer.fields.status') }}</Label>
                <Select v-model="formData.payment_status">
                <SelectTrigger><SelectValue :placeholder="String($t('trip_accommodation_drawer.placeholders.status'))" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">{{ $t('trip_accommodation_drawer.status.paid') }}</SelectItem>
                  <SelectItem value="pending">{{ $t('trip_accommodation_drawer.status.pending') }}</SelectItem>
                  <SelectItem value="refunded">{{ $t('trip_accommodation_drawer.status.refunded') }}</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
            <div>
              <Label>{{ $t('trip_accommodation_drawer.fields.google_maps_link') }}</Label>
              <Input v-model="formData.google_maps_link" :placeholder="String($t('trip_accommodation_drawer.placeholders.google_maps_link'))" />
            </div>
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2">
                <Switch v-model="formData.has_luggage_forwarding" id="takkyubin" />
                <Label htmlFor="takkyubin">{{ $t('trip_accommodation_drawer.toggles.takkyubin') }}</Label>
              </div>
            </div>
            <div>
              <Label>{{ $t('trip_accommodation_drawer.fields.phone') }}</Label>
              <Input v-model="formData.phone" :placeholder="String($t('trip_accommodation_drawer.placeholders.phone'))" />
            </div>
            <div>
              <Label>{{ $t('trip_accommodation_drawer.fields.email') }}</Label>
              <Input v-model="formData.email" :placeholder="String($t('trip_accommodation_drawer.placeholders.email'))" />
            </div>
            <div>
              <Label>{{ $t('trip_accommodation_drawer.fields.notes') }}</Label>
              <Textarea v-model="formData.notes" :placeholder="String($t('trip_accommodation_drawer.placeholders.notes'))" class="resize-none" />
            </div>
          </div>
          <div class="w-full lg:w-1/3 space-y-8 py-4">
            <div v-if="formId" class="pb-8">
              <div class="flex justify-between items-center mb-2">
                <Label>{{ $t('trip_accommodation_drawer.fields.attachments') }}</Label>
                <FileUploader collection="accommodations" :item-id="formId" @uploaded="onFileUploaded" />
              </div>
              <FileList :files="formAdjuntos" collection="accommodations" @deleted="onFileUploaded" />
            </div>
          </div>
        </div>
      </ScrollArea>
      <DrawerFooter class="max-w-3xl mx-auto w-full">
        <Button @click="saveAccommodation" :disabled="!isValid">{{ $t('trip_accommodation_drawer.actions.save') }}</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
