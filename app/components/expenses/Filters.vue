<template>
  <div class="space-y-4">
    <!-- Header with clear button -->
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-gray-900">Filtros</h3>
      <Button
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        @click="clearFilters"
        class="h-8 px-2 text-xs"
      >
        Limpiar todo
      </Button>
    </div>

    <!-- Search -->
    <div>
      <div class="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
        <Input
          :model-value="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="pl-10 bg-white"
          @update:model-value="handleSearchChange"
        />
      </div>
    </div>

    <!-- Date Filter -->
    <div>
      <Label class="text-xs mb-1.5 block text-gray-500">Fecha</Label>
      <DateRangeFilter :model-value="dateRange" @date-change="handleDateChange" />
    </div>

    <!-- Category Filter -->
    <div>
      <Label class="text-xs mb-1.5 block text-gray-500">Categoría</Label>
      <Select :model-value="category" @update:model-value="handleCategoryChange">
        <SelectTrigger class="w-full bg-white">
          <SelectValue placeholder="Categorías" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          <SelectItem
            v-for="cat in CATEGORIES"
            :key="cat.key"
            :value="cat.key"
          >
            {{ cat.icon }} {{ cat.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Payment Method Filter -->
    <div>
      <Label class="text-xs mb-1.5 block text-gray-500">Método de pago</Label>
      <Select :model-value="payment" @update:model-value="handlePaymentChange">
        <SelectTrigger class="w-full bg-white">
          <SelectValue placeholder="Métodos de pago" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="cash">💴 Efectivo</SelectItem>
          <SelectItem value="card">💳 Tarjeta</SelectItem>
          <SelectItem value="ic" class="flex items-center gap-0"><img src="/ic.webp" alt="IC" class="w-5 h-5" /> IC</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Shared Filter Checkbox -->
    <div class="flex items-center space-x-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50 transition-colors cursor-pointer" @click="toggleSharedFilter">
      <div
        class="size-4 shrink-0 rounded-[4px] border shadow-xs transition-all flex items-center justify-center"
        :class="shared ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'"
      >
        <svg
          v-if="shared"
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="text-sm font-medium flex items-center gap-1.5 pointer-events-none select-none">
        <span class="text-lg">⭐</span>
        <span>Solo destacados</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types'
import type { DateFilterRange } from '~/components/common/DateRangeFilter.vue'
import DateRangeFilter from '~/components/common/DateRangeFilter.vue'

const props = defineProps<{
  searchQuery: string
  category: string
  payment: string
  shared: boolean
  dateRange: DateFilterRange
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'search-change': [value: string]
  'update:category': [value: string]
  'category-change': [value: string]
  'update:payment': [value: string]
  'payment-change': [value: string]
  'update:shared': [value: boolean]
  'shared-change': [value: boolean]
  'update:dateRange': [value: DateFilterRange]
  'date-change': [value: DateFilterRange]
  'clear': []
}>()

const hasActiveFilters = computed(() => {
  return props.searchQuery !== '' || props.category !== 'all' || props.payment !== 'all' || props.shared || props.dateRange.start !== null
})

function handleSearchChange(value: string | number) {
  emit('update:searchQuery', String(value))
  emit('search-change', String(value))
}

function handleCategoryChange(value: string) {
  emit('update:category', value)
  emit('category-change', value)
}

function handlePaymentChange(value: string) {
  emit('update:payment', value)
  emit('payment-change', value)
}

function handleDateChange(range: DateFilterRange) {
  emit('update:dateRange', range)
  emit('date-change', range)
}

function toggleSharedFilter() {
  const newValue = !props.shared
  emit('update:shared', newValue)
  emit('shared-change', newValue)
}

function clearFilters() {
  emit('update:searchQuery', '')
  emit('update:category', 'all')
  emit('update:payment', 'all')
  emit('update:shared', false)
  emit('update:dateRange', { start: null, end: null })
  
  emit('search-change', '')
  emit('category-change', 'all')
  emit('payment-change', 'all')
  emit('shared-change', false)
  emit('date-change', { start: null, end: null })
  
  emit('clear')
}
</script>
