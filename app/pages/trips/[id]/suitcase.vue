<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Backpack, Plus, Trash2, Loader2, GripVertical, Minus, MoreVertical, Pencil } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Suitcase, SuitcaseItem, SuitcaseType } from '~/types/directus'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/alert-dialog'
import { useTripLuggage } from '~/composables/useTripLuggage'
import { NumberField, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '~/components/ui/number-field'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const { t } = useI18n()

const tripId = computed(() => parseInt(route.params.id as string))

const {
  suitcases,
  loading,
  fetchSuitcases,
  createSuitcase,
  deleteSuitcaseById,
  updateSuitcaseById,
  createSuitcaseItem,
  updateSuitcaseItem,
  deleteSuitcaseItemById
} = useTripLuggage()

const isCreateSuitcaseOpen = ref(false)
const newSuitcaseName = ref('')
const newSuitcaseType = ref<SuitcaseType | ''>('')
const isSubmittingSuitcase = ref(false)

const isEditSuitcaseOpen = ref(false)
const editSuitcaseId = ref<number | null>(null)
const editSuitcaseName = ref('')
const isSubmittingSuitcaseEdit = ref(false)

const newItemBySuitcase = reactive<Record<number, { name: string, quantity: number }>>({})
const busyItemIds = ref<Set<number>>(new Set())

const isItemBusy = (id: number) => busyItemIds.value.has(id)

const dragOver = ref<{ suitcaseId: number, itemId: number } | null>(null)
const dragPayload = ref<{ suitcaseId: number, itemId: number } | null>(null)
const dragOverSuitcaseId = ref<number | null>(null)

const suitcaseTypeLabel = (type: SuitcaseType) => {
  return String(t(`trip_luggage_page.suitcase.types.${type}`))
}

const normalizedSuitcases = computed(() => {
  const list = Array.isArray(suitcases.value) ? suitcases.value : []
  return list.map((s) => {
    const itemsRaw = (s as any)?.items
    const items = Array.isArray(itemsRaw) ? (itemsRaw as SuitcaseItem[]) : []
    const sortedItems = [...items].sort((a, b) => (Number(a.sort ?? Number.MAX_SAFE_INTEGER) - Number(b.sort ?? Number.MAX_SAFE_INTEGER)) || (a.id - b.id))
    return { ...(s as Suitcase), items: sortedItems }
  })
})

const canCreateSuitcase = computed(() => {
  return Boolean(String(newSuitcaseName.value || '').trim()) && Boolean(newSuitcaseType.value)
})

const canEditSuitcase = computed(() => {
  return Boolean(editSuitcaseId.value) && Boolean(String(editSuitcaseName.value || '').trim())
})

const getSuitcaseItems = (s: Suitcase) => {
  const itemsRaw = (s as any)?.items
  return Array.isArray(itemsRaw) ? (itemsRaw as SuitcaseItem[]) : []
}

const sortItems = (items: SuitcaseItem[]) => {
  return [...items].sort((a, b) => (Number(a.sort ?? Number.MAX_SAFE_INTEGER) - Number(b.sort ?? Number.MAX_SAFE_INTEGER)) || (a.id - b.id))
}

const refresh = async () => {
  await fetchSuitcases(tripId.value)
}

onMounted(async () => {
  try {
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  }
})

const submitCreateSuitcase = async () => {
  if (!canCreateSuitcase.value) return
  isSubmittingSuitcase.value = true
  try {
    await createSuitcase(tripId.value, {
      name: String(newSuitcaseName.value || '').trim(),
      type: newSuitcaseType.value as SuitcaseType
    })
    toast.success(String(t('trip_luggage_page.toasts.suitcase_created')))
    newSuitcaseName.value = ''
    newSuitcaseType.value = ''
    isCreateSuitcaseOpen.value = false
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  } finally {
    isSubmittingSuitcase.value = false
  }
}

const removeSuitcase = async (id: number) => {
  try {
    await deleteSuitcaseById(tripId.value, id)
    toast.success(String(t('trip_luggage_page.toasts.suitcase_deleted')))
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  }
}

const openEditSuitcase = (s: Suitcase) => {
  editSuitcaseId.value = s.id
  editSuitcaseName.value = String(s.name || '').trim()
  isEditSuitcaseOpen.value = true
}

const submitEditSuitcase = async () => {
  if (!canEditSuitcase.value) return
  isSubmittingSuitcaseEdit.value = true
  try {
    await updateSuitcaseById({
      tripId: tripId.value,
      id: editSuitcaseId.value as number,
      updates: { name: String(editSuitcaseName.value || '').trim() }
    })
    toast.success(String(t('trip_luggage_page.toasts.suitcase_updated')))
    isEditSuitcaseOpen.value = false
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  } finally {
    isSubmittingSuitcaseEdit.value = false
  }
}

const ensureNewItemState = (suitcaseId: number) => {
  if (!newItemBySuitcase[suitcaseId]) {
    newItemBySuitcase[suitcaseId] = { name: '', quantity: 1 }
  }
  return newItemBySuitcase[suitcaseId]
}

const addItem = async (suitcaseId: number) => {
  const st = ensureNewItemState(suitcaseId)
  const name = String(st.name || '').trim()
  const quantity = Number(st.quantity || 1)
  if (!name || !Number.isFinite(quantity) || quantity < 0) return

  try {
    await createSuitcaseItem({ tripId: tripId.value, suitcaseId, name, quantity })
    toast.success(String(t('trip_luggage_page.toasts.item_added')))
    st.name = ''
    st.quantity = 1
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  }
}

const togglePacked = async (item: SuitcaseItem, checked: any) => {
  const next = Boolean(checked)
  busyItemIds.value.add(item.id)
  try {
    await updateSuitcaseItem({ tripId: tripId.value, id: item.id, updates: { packed: next } })
    toast.success(String(t('trip_luggage_page.toasts.item_updated')))
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  } finally {
    busyItemIds.value.delete(item.id)
  }
}

const changeQuantity = async (item: SuitcaseItem, delta: number) => {
  const next = Math.max(0, Number(item.quantity || 0) + delta)
  if (next === item.quantity) return

  busyItemIds.value.add(item.id)
  try {
    await updateSuitcaseItem({ tripId: tripId.value, id: item.id, updates: { quantity: next } })
    toast.success(String(t('trip_luggage_page.toasts.item_updated')))
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  } finally {
    busyItemIds.value.delete(item.id)
  }
}

const setItemQuantity = async (item: SuitcaseItem, nextRaw: number) => {
  const next = Math.max(0, Number(nextRaw || 0))
  if (next === item.quantity) return

  busyItemIds.value.add(item.id)
  try {
    await updateSuitcaseItem({ tripId: tripId.value, id: item.id, updates: { quantity: next } })
    toast.success(String(t('trip_luggage_page.toasts.item_updated')))
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  } finally {
    busyItemIds.value.delete(item.id)
  }
}

const removeItem = async (id: number) => {
  try {
    await deleteSuitcaseItemById(tripId.value, id)
    toast.success(String(t('trip_luggage_page.toasts.item_deleted')))
    await refresh()
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  }
}

const onDragStart = (suitcaseId: number, itemId: number, e: DragEvent) => {
  dragOver.value = null
  dragPayload.value = { suitcaseId, itemId }
  e.dataTransfer?.setData('application/json', JSON.stringify({ suitcaseId, itemId }))
  e.dataTransfer?.setData('text/plain', String(itemId))
  const row = (e.target as HTMLElement | null)?.closest?.('[data-luggage-item-row="true"]') as HTMLElement | null
  if (row) {
    e.dataTransfer?.setDragImage?.(row, 24, 24)
  }
}

const onDragEnd = () => {
  dragOver.value = null
  dragPayload.value = null
  dragOverSuitcaseId.value = null
}

const onDragOver = (suitcaseId: number, itemId: number) => {
  dragOverSuitcaseId.value = suitcaseId
  dragOver.value = { suitcaseId, itemId }
}

const onDragOverSuitcase = (suitcaseId: number) => {
  dragOverSuitcaseId.value = suitcaseId
}

const persistItemOrder = async (changes: Array<{ id: number, sort: number, suitcaseId?: number }>) => {
  const ids = changes.map(c => c.id)
  ids.forEach(id => busyItemIds.value.add(id))

  try {
    for (const c of changes) {
      await updateSuitcaseItem({
        tripId: tripId.value,
        id: c.id,
        updates: { sort: c.sort, suitcaseId: c.suitcaseId }
      })
    }
    toast.success(String(t('trip_luggage_page.toasts.order_saved')))
  } catch {
    toast.error(String(t('trip_luggage_page.toasts.error')))
  } finally {
    ids.forEach(id => busyItemIds.value.delete(id))
    await refresh()
  }
}

const moveBetweenSuitcases = async (fromSuitcaseId: number, toSuitcaseId: number, draggedItemId: number, targetItemId: number | null) => {
  const currentSuitcases = Array.isArray(suitcases.value) ? suitcases.value : []
  const fromSuitcase = currentSuitcases.find(s => s.id === fromSuitcaseId) as any
  const toSuitcase = currentSuitcases.find(s => s.id === toSuitcaseId) as any
  if (!fromSuitcase || !toSuitcase) return

  const fromItems = sortItems(getSuitcaseItems(fromSuitcase))
  const toItems = sortItems(getSuitcaseItems(toSuitcase))

  const fromIdx = fromItems.findIndex(i => i.id === draggedItemId)
  if (fromIdx === -1) return
  const [moved] = fromItems.splice(fromIdx, 1)
  if (!moved) return

  const insertAt = targetItemId
    ? Math.max(0, toItems.findIndex(i => i.id === targetItemId))
    : toItems.length

  const nextInsertAt = insertAt === -1 ? toItems.length : insertAt
  toItems.splice(nextInsertAt, 0, moved)

  fromItems.forEach((it, idx) => { (it as any).sort = idx + 1 })
  toItems.forEach((it, idx) => { (it as any).sort = idx + 1 })
  ;(fromSuitcase as any).items = fromItems
  ;(toSuitcase as any).items = toItems

  const changes: Array<{ id: number, sort: number, suitcaseId?: number }> = [
    ...fromItems.map(it => ({ id: it.id, sort: Number(it.sort ?? 1) })),
    ...toItems.map(it => ({
      id: it.id,
      sort: Number(it.sort ?? 1),
      suitcaseId: it.id === moved.id ? toSuitcaseId : undefined
    }))
  ]

  await persistItemOrder(changes)
}

const moveWithinSuitcaseToEnd = async (suitcaseId: number, draggedItemId: number) => {
  const currentSuitcases = Array.isArray(suitcases.value) ? suitcases.value : []
  const suitcase = currentSuitcases.find(s => s.id === suitcaseId) as any
  if (!suitcase) return

  const items = sortItems(getSuitcaseItems(suitcase))
  const from = items.findIndex(i => i.id === draggedItemId)
  if (from === -1) return

  const [moved] = items.splice(from, 1)
  if (!moved) return
  items.push(moved)
  items.forEach((it, idx) => { (it as any).sort = idx + 1 })
  ;(suitcase as any).items = items

  await persistItemOrder(items.map(it => ({ id: it.id, sort: Number(it.sort ?? 1) })))
}

const reorderItems = async (suitcaseId: number, draggedItemId: number, targetItemId: number) => {
  if (draggedItemId === targetItemId) return
  const currentSuitcases = Array.isArray(suitcases.value) ? suitcases.value : []
  const suitcase = currentSuitcases.find(s => s.id === suitcaseId)
  if (!suitcase) return

  const items = sortItems(getSuitcaseItems(suitcase))
  const from = items.findIndex(i => i.id === draggedItemId)
  const to = items.findIndex(i => i.id === targetItemId)
  if (from === -1 || to === -1) return

  const [moved] = items.splice(from, 1)
  if (!moved) return
  items.splice(to, 0, moved)
  items.forEach((it, idx) => { (it as any).sort = idx + 1 })
  ;(suitcase as any).items = items

  await persistItemOrder(items.map(it => ({ id: it.id, sort: Number(it.sort ?? 1) })))
}

const onDrop = async (suitcaseId: number, targetItemId: number, e: DragEvent) => {
  dragOver.value = null
  dragOverSuitcaseId.value = null
  const raw = e.dataTransfer?.getData('application/json') || ''
  try {
    const parsed = JSON.parse(raw)
    const fromSuitcaseId = Number(parsed?.suitcaseId)
    const draggedItemId = Number(parsed?.itemId)
    if (!Number.isFinite(fromSuitcaseId) || !Number.isFinite(draggedItemId)) return
    if (fromSuitcaseId === suitcaseId) {
      await reorderItems(suitcaseId, draggedItemId, targetItemId)
      return
    }
    await moveBetweenSuitcases(fromSuitcaseId, suitcaseId, draggedItemId, targetItemId)
  } catch {
  }
}

const onDropEmpty = async (suitcaseId: number, e: DragEvent) => {
  dragOver.value = null
  dragOverSuitcaseId.value = null
  const raw = e.dataTransfer?.getData('application/json') || ''
  try {
    const parsed = JSON.parse(raw)
    const fromSuitcaseId = Number(parsed?.suitcaseId)
    const draggedItemId = Number(parsed?.itemId)
    if (!Number.isFinite(fromSuitcaseId) || !Number.isFinite(draggedItemId)) return
    if (fromSuitcaseId === suitcaseId) {
      await moveWithinSuitcaseToEnd(suitcaseId, draggedItemId)
      return
    }
    await moveBetweenSuitcases(fromSuitcaseId, suitcaseId, draggedItemId, null)
  } catch {
  }
}
</script>

<template>
  <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <div class="flex flex-col lg:flex-row gap-6 items-start justify-between">
      <div class="flex items-start gap-4">
        <div class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-1">
          <Backpack class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-2xl font-bold tracking-tight">{{ $t('trip_luggage_page.suitcases.title') }}</h2>
          <p class="text-muted-foreground hidden md:block">{{ $t('trip_luggage_page.subtitle') }}</p>
        </div>
      </div>

      <Dialog :open="isCreateSuitcaseOpen" @update:open="isCreateSuitcaseOpen = $event">
        <DialogTrigger as-child>
          <Button>
            <Plus class="h-4 w-4" />
            {{ $t('trip_luggage_page.suitcase.add_button') }}
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{{ $t('trip_luggage_page.suitcase.create_title') }}</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div class="space-y-4 py-2">
            <div class="space-y-2">
              <Label for="suitcase_name">{{ $t('trip_luggage_page.suitcase.name_label') }}</Label>
              <Input
                id="suitcase_name"
                v-model="newSuitcaseName"
                :placeholder="$t('trip_luggage_page.suitcase.name_placeholder')"
                @keyup.enter="submitCreateSuitcase"
              />
            </div>

            <div class="space-y-2">
              <Label>{{ $t('trip_luggage_page.suitcase.type_label') }}</Label>
              <Select v-model="newSuitcaseType">
                <SelectTrigger>
                  <SelectValue :placeholder="String($t('trip_luggage_page.suitcase.type_placeholder'))" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="checked">{{ $t('trip_luggage_page.suitcase.types.checked') }}</SelectItem>
                    <SelectItem value="carry_on">{{ $t('trip_luggage_page.suitcase.types.carry_on') }}</SelectItem>
                    <SelectItem value="backpack">{{ $t('trip_luggage_page.suitcase.types.backpack') }}</SelectItem>
                    <SelectItem value="other">{{ $t('trip_luggage_page.suitcase.types.other') }}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter class="sm:justify-end">
            <Button @click="submitCreateSuitcase" :disabled="!canCreateSuitcase || isSubmittingSuitcase">
              <Loader2 v-if="isSubmittingSuitcase" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('trip_luggage_page.suitcase.add_button') }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog :open="isEditSuitcaseOpen" @update:open="isEditSuitcaseOpen = $event">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{{ $t('trip_luggage_page.suitcase.edit.title') }}</DialogTitle>
            <DialogDescription>{{ $t('trip_luggage_page.suitcase.edit.description') }}</DialogDescription>
          </DialogHeader>

          <div class="space-y-2">
            <Label for="edit_suitcase_name">{{ $t('trip_luggage_page.suitcase.name_label') }}</Label>
            <Input
              id="edit_suitcase_name"
              v-model="editSuitcaseName"
              :placeholder="$t('trip_luggage_page.suitcase.name_placeholder')"
              @keyup.enter="submitEditSuitcase"
            />
          </div>

          <DialogFooter class="sm:justify-end">
            <Button variant="outline" @click="isEditSuitcaseOpen = false">{{ $t('trip_luggage_page.suitcase.edit.cancel') }}</Button>
            <Button @click="submitEditSuitcase" :disabled="!canEditSuitcase || isSubmittingSuitcaseEdit">
              <Loader2 v-if="isSubmittingSuitcaseEdit" class="mr-2 h-4 w-4 animate-spin" />
              {{ $t('trip_luggage_page.suitcase.edit.save') }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <div class="space-y-3">
      <div v-if="loading" class="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span>{{ $t('trip_luggage_page.suitcases.title') }}</span>
      </div>

      <div v-else-if="normalizedSuitcases.length === 0" class="rounded-lg border border-input bg-white p-6">
        <p class="font-medium">{{ $t('trip_luggage_page.suitcases.empty_title') }}</p>
        <p class="text-sm text-muted-foreground mt-1">{{ $t('trip_luggage_page.suitcases.empty_subtitle') }}</p>
      </div>

      <div v-else class="grid gap-4 xl:grid-cols-2">
        <Card
          v-for="s in normalizedSuitcases"
          :key="s.id"
          :class="[
            'overflow-hidden',
            dragPayload && dragPayload.suitcaseId !== s.id && dragOverSuitcaseId === s.id ? 'ring-2 ring-primary/30' : ''
          ]"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex items-center gap-2">
                <CardTitle class="text-base leading-tight truncate">{{ s.name }}</CardTitle>
                <Badge variant="secondary">{{ suitcaseTypeLabel(s.type) }}</Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="sm" class="h-8 w-8 px-0">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openEditSuitcase(s)">
                    <Pencil class="mr-2 h-4 w-4" />
                    {{ $t('trip_luggage_page.suitcase.actions.edit') }}
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <DropdownMenuItem class="text-red-600 focus:text-red-600">
                        <Trash2 class="mr-2 h-4 w-4" />
                        {{ $t('trip_luggage_page.suitcase.actions.delete') }}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{{ $t('trip_luggage_page.suitcase.delete.title') }}</AlertDialogTitle>
                        <AlertDialogDescription>{{ $t('trip_luggage_page.suitcase.delete.description') }}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{{ $t('trip_luggage_page.suitcase.delete.cancel') }}</AlertDialogCancel>
                        <AlertDialogAction @click="removeSuitcase(s.id)">{{ $t('trip_luggage_page.suitcase.delete.confirm') }}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent class="space-y-4">
            <div class="space-y-2">
              <div class="text-sm font-medium">{{ $t('trip_luggage_page.items.title') }}</div>
              <div v-if="(s.items || []).length > 1" class="text-xs text-muted-foreground">
                {{ $t('trip_luggage_page.items.reorder_hint') }}
              </div>
              <div v-if="dragPayload && dragPayload.suitcaseId !== s.id && dragOverSuitcaseId === s.id" class="text-xs text-muted-foreground">
                {{ $t('trip_luggage_page.items.move_hint') }}
              </div>

              <div
                v-if="(s.items || []).length === 0"
                class="text-sm text-muted-foreground"
                @dragover.prevent="onDragOverSuitcase(s.id)"
                @drop.prevent="onDropEmpty(s.id, $event)"
              >
                {{ $t('trip_luggage_page.items.empty') }}
              </div>

              <div
                v-else
                class="space-y-2"
                @dragover.prevent="onDragOverSuitcase(s.id)"
                @drop.prevent="onDropEmpty(s.id, $event)"
              >
                <div
                  v-for="it in s.items"
                  :key="it.id"
                  data-luggage-item-row="true"
                  :class="[
                    'flex items-center gap-3 rounded-md border border-input bg-white px-3 py-2',
                    dragOver?.suitcaseId === s.id && dragOver?.itemId === it.id ? 'ring-2 ring-primary/40' : ''
                  ]"
                  @dragover.stop.prevent="onDragOver(s.id, it.id)"
                  @drop.stop.prevent="onDrop(s.id, it.id, $event)"
                >
                  <button
                    type="button"
                    class="cursor-grab text-muted-foreground hover:text-foreground"
                    draggable="true"
                    :aria-label="String($t('trip_luggage_page.items.drag_handle'))"
                    @dragstart="onDragStart(s.id, it.id, $event)"
                    @dragend="onDragEnd"
                  >
                    <GripVertical class="h-4 w-4" />
                  </button>

                  <Checkbox
                    :model-value="it.packed"
                    :disabled="isItemBusy(it.id)"
                    @update:modelValue="togglePacked(it, $event)"
                  />

                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate" :class="it.packed ? 'line-through text-muted-foreground' : ''">
                      {{ it.name }}
                    </div>
                  </div>

                  <NumberField
                    :model-value="Number(it.quantity || 0)"
                    :min="0"
                    :step="1"
                    :disableWheelChange="true"
                    :disabled="isItemBusy(it.id)"
                    @update:modelValue="setItemQuantity(it, $event)"
                  >
                    <NumberFieldDecrement :aria-label="String($t('trip_luggage_page.items.quantity_decrease'))">
                      <Minus class="h-4 w-4" />
                    </NumberFieldDecrement>
                    <NumberFieldInput class="h-8 w-10 px-0" />
                    <NumberFieldIncrement :aria-label="String($t('trip_luggage_page.items.quantity_increase'))">
                      <Plus class="h-4 w-4" />
                    </NumberFieldIncrement>
                  </NumberField>

                  <div class="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-8 w-8 px-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      :disabled="isItemBusy(it.id)"
                      @click="removeItem(it.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-md border border-input bg-slate-50 p-3 space-y-3">
              <div class="grid grid-cols-[1fr_auto_auto] gap-3">
                <div class="space-y-1.5 min-w-0">
                  <Label :for="`item_name_${s.id}`">{{ $t('trip_luggage_page.items.name_label') }}</Label>
                  <Input
                    :id="`item_name_${s.id}`"
                    v-model="ensureNewItemState(s.id).name"
                    :placeholder="$t('trip_luggage_page.items.name_placeholder')"
                    @keyup.enter="addItem(s.id)"
                  />
                </div>
                <div class="space-y-1.5 w-fit">
                  <Label :for="`item_qty_${s.id}`">{{ $t('trip_luggage_page.items.quantity_label') }}</Label>
                  <Input
                    :id="`item_qty_${s.id}`"
                    v-model.number="ensureNewItemState(s.id).quantity"
                    class="w-24"
                    type="number"
                    min="0"
                    :placeholder="$t('trip_luggage_page.items.quantity_placeholder')"
                    @keyup.enter="addItem(s.id)"
                  />
                </div>
                <div class="flex items-end w-fit">
                  <Button class="w-8" @click="addItem(s.id)">
                    <Plus class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
