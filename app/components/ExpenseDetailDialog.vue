<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Detalles del Gasto</DialogTitle>
      </DialogHeader>
      <div v-if="expense" class="space-y-4">
        <!-- Place Name -->
        <div>
          <div class="text-sm font-medium text-gray-600 mb-1">Lugar</div>
          <div class="text-lg font-semibold">{{ expense.placeName }}</div>
        </div>

        <!-- Amount -->
        <div>
          <div class="text-sm font-medium text-gray-600 mb-1">Cantidad</div>
          <div class="text-2xl font-bold text-teal-600">{{ formatYen(expense.amount) }}</div>
        </div>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-medium text-gray-600 mb-1">Fecha</div>
            <div>{{ formatDate(expense.timestamp) }}</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-600 mb-1">Hora</div>
            <div>{{ formatTime(expense.timestamp) }}</div>
          </div>
        </div>

        <!-- Category & Payment -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-medium text-gray-600 mb-1">Categoría</div>
            <Badge :class="categoryInfo.color">
              {{ categoryInfo.icon }} {{ categoryInfo.label }}
            </Badge>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-600 mb-1">Pago</div>
            <Badge variant="outline">
              {{ expense.paymentMethod === 'cash' ? '💴 Efectivo' : expense.paymentMethod === 'card' ? '💳 Tarjeta' : '🎫 IC' }}
            </Badge>
          </div>
        </div>

        <!-- Location -->
        <div>
          <div class="text-sm font-medium text-gray-600 mb-1">Ubicación</div>
          <div class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <div>
              <div>{{ expense.location.city }}</div>
              <div class="text-sm text-gray-600">{{ expense.location.prefecture }}</div>
              <div v-if="showCoordinates && expense.location.coordinates.lat !== 0" class="text-xs text-gray-500 mt-1">
                {{ expense.location.coordinates.lat.toFixed(6) }}, {{ expense.location.coordinates.lng.toFixed(6) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="expense.notes">
          <div class="text-sm font-medium text-gray-600 mb-1">Notas</div>
          <p class="text-sm text-gray-700">{{ expense.notes }}</p>
        </div>

        <!-- Shared -->
        <div v-if="expense.shared">
          <Badge variant="outline" class="border-purple-300 text-purple-700">
            👥 Gasto compartido
          </Badge>
        </div>
      </div>

      <DialogFooter class="mt-6">
        <!-- Custom action slot (e.g., "Ver en Mapa" button) -->
        <slot name="custom-action" :expense="expense" />

        <div v-if="!readOnly" class="flex gap-2 w-full" :class="{ 'mt-2': $slots['custom-action'] }">
          <Button
            variant="outline"
            @click="handleDelete"
            class="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" x2="10" y1="11" y2="17"/>
              <line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
            Eliminar
          </Button>
          <Button
            @click="handleEdit"
            variant="outline"
            class="flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
              <path d="m15 5 4 4"/>
            </svg>
            Editar
          </Button>
        </div>
        <Button v-else @click="isOpen = false" class="w-full" :class="{ 'mt-2': $slots['custom-action'] }">
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Confirmation Dialog -->
  <Dialog v-model:open="showDeleteConfirm">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogDescription>
          ¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>
      <div v-if="expense" class="py-4">
        <div class="text-sm text-gray-700">
          <div class="font-semibold">{{ expense.placeName }}</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">
            {{ formatYen(expense.amount) }}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showDeleteConfirm = false">
          Cancelar
        </Button>
        <Button
          @click="confirmDelete"
          class="bg-red-600 hover:bg-red-700 text-white"
        >
          Eliminar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Expense } from '~/types'
import { getCategoryInfo } from '~/types'
import { formatYen } from '~/utils/currency'
import { formatDate, formatTime } from '~/utils/dates'

interface Props {
  modelValue: boolean
  expense: Expense | null
  showCoordinates?: boolean
  readOnly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', expense: Expense): void
  (e: 'delete', expense: Expense): void
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: false,
  readOnly: false
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const showDeleteConfirm = ref(false)

const categoryInfo = computed(() =>
  props.expense ? getCategoryInfo(props.expense.category) : { icon: '', label: '', color: '' }
)

function handleEdit() {
  if (props.expense) {
    emit('edit', props.expense)
  }
}

function handleDelete() {
  isOpen.value = false
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (props.expense) {
    emit('delete', props.expense)
    showDeleteConfirm.value = false
  }
}
</script>
