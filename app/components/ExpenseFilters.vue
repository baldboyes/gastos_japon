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
          placeholder="Buscar por lugar..."
          class="pl-10"
          @input="handleSearchChange"
        />
      </div>
    </div>

    <!-- Filters Row -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      <!-- Category Filter -->
      <Select v-model="selectedCategory" @update:model-value="handleCategoryChange">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Todas las categorías" />
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
        <SelectTrigger class="w-[150px]">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="cash">💴 Efectivo</SelectItem>
          <SelectItem value="card">💳 Tarjeta</SelectItem>
          <SelectItem value="ic">🎫 IC</SelectItem>
        </SelectContent>
      </Select>

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
        {{ selectedPayment === 'cash' ? '💴 Efectivo' : selectedPayment === 'card' ? '💳 Tarjeta' : '🎫 IC' }}
        <button @click="selectedPayment = 'all'; handlePaymentChange()" class="ml-1">
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

const emit = defineEmits<{
  'search-change': [query: string]
  'category-change': [category: string]
  'payment-change': [payment: string]
}>()

const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || selectedCategory.value !== 'all' || selectedPayment.value !== 'all'
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

function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedPayment.value = 'all'
  emit('search-change', '')
  emit('category-change', 'all')
  emit('payment-change', 'all')
}
</script>
