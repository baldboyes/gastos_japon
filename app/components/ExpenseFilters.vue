<template>
  <div class="space-y-4">
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
          v-model="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="pl-10 bg-white"
          @input="handleSearchChange"
        />
      </div>
    </div>

    <!-- Filters Row -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      <!-- Category Filter -->
      <Select v-model="selectedCategory" @update:model-value="handleCategoryChange">
        <SelectTrigger class="w-[180px] bg-white">
          <SelectValue placeholder="Categorías" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          <SelectItem
            v-for="category in CATEGORIES"
            :key="category.key"
            :value="category.key"
          >
            {{ category.icon }} {{ category.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Payment Method Filter -->
      <Select v-model="selectedPayment" @update:model-value="handlePaymentChange">
        <SelectTrigger class="w-[150px] bg-white">
          <SelectValue placeholder="Métodos de pago" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="cash">💴 Efectivo</SelectItem>
          <SelectItem value="card">💳 Tarjeta</SelectItem>
          <SelectItem value="ic" class="flex items-center gap-0"><img src="/ic.webp" alt="IC" class="w-5 h-5" /> IC</SelectItem>
        </SelectContent>
      </Select>

      <!-- Shared Filter Checkbox -->
      <div class="flex items-center space-x-2 px-3 py-1 rounded-md border bg-white hover:bg-gray-50 transition-colors">
        <Checkbox
          id="sharedFilter"
          :checked="showSharedOnly"
          @update:checked="handleSharedToggle"
        />
        <Label
          for="sharedFilter"
          class="text-sm font-medium cursor-pointer flex items-center gap-1.5"
        >
          <span class="text-lg">⭐</span>
        </Label>
      </div>

      <!-- Clear Filters -->
      <Button
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        @click="clearFilters"
        class="whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
        Limpiar
      </Button>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="flex items-center gap-2 flex-wrap">
      <Badge v-if="searchQuery" variant="secondary" class="gap-1">
        Búsqueda: "{{ searchQuery }}"
        <button @click="searchQuery = ''; handleSearchChange()" class="ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </Badge>

      <Badge v-if="selectedCategory !== 'all'" variant="secondary" class="gap-1">
        {{ getCategoryInfo(selectedCategory as ExpenseCategory).icon }}
        {{ getCategoryInfo(selectedCategory as ExpenseCategory).label }}
        <button @click="selectedCategory = 'all'; handleCategoryChange()" class="ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </Badge>

      <Badge v-if="selectedPayment !== 'all'" variant="secondary" class="gap-1">
        <template v-if="selectedPayment === 'cash'">💴 Efectivo</template>
        <template v-else-if="selectedPayment === 'card'">💳 Tarjeta</template>
        <template v-else>
          <div class="flex items-center gap-1"><img src="/ic.webp" alt="IC" class="w-4 h-4 inline-block" /> IC</div>
        </template>
        <button @click="selectedPayment = 'all'; handlePaymentChange()" class="ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </Badge>

      <Badge v-if="showSharedOnly" variant="secondary" class="gap-1">
        ⭐ Destacados
        <button @click="showSharedOnly = false; handleSharedToggle(false)" class="ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExpenseCategory } from '~/types'
import { CATEGORIES, getCategoryInfo } from '~/types'

const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedPayment = ref('all')
const showSharedOnly = ref(false)

const emit = defineEmits<{
  'search-change': [query: string]
  'category-change': [category: string]
  'payment-change': [payment: string]
  'shared-change': [showShared: boolean]
}>()

const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || selectedCategory.value !== 'all' || selectedPayment.value !== 'all' || showSharedOnly.value
})

function handleSearchChange() {
  emit('search-change', searchQuery.value)
}

function handleCategoryChange() {
  emit('category-change', selectedCategory.value)
}

function handlePaymentChange() {
  emit('payment-change', selectedPayment.value)
}

function handleSharedToggle(checked: boolean | string) {
  // Handle both boolean and string (from checkbox component)
  showSharedOnly.value = checked === true || checked === 'true'
  emit('shared-change', showSharedOnly.value)
}

function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedPayment.value = 'all'
  showSharedOnly.value = false
  emit('search-change', '')
  emit('category-change', 'all')
  emit('payment-change', 'all')
  emit('shared-change', false)
}
</script>
