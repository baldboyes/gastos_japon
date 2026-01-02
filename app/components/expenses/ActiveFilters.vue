<template>
  <div v-if="hasActiveFilters" class="flex items-center gap-2 flex-wrap">
    <Badge v-if="searchQuery" variant="secondary" class="gap-1">
      Búsqueda: "{{ searchQuery }}"
      <button @click="$emit('update:searchQuery', ''); $emit('search-change', '')" class="ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
    </Badge>

    <Badge v-if="category !== 'all'" variant="secondary" class="gap-1">
      {{ getCategoryInfo(category as ExpenseCategory).icon }}
      {{ getCategoryInfo(category as ExpenseCategory).label }}
      <button @click="$emit('update:category', 'all'); $emit('category-change', 'all')" class="ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
    </Badge>

    <Badge v-if="payment !== 'all'" variant="secondary" class="gap-1">
      <template v-if="payment === 'cash'">💴 Efectivo</template>
      <template v-else-if="payment === 'card'">💳 Tarjeta</template>
      <template v-else>
        <div class="flex items-center gap-1"><img src="/ic.webp" alt="IC" class="w-4 h-4 inline-block" /> IC</div>
      </template>
      <button @click="$emit('update:payment', 'all'); $emit('payment-change', 'all')" class="ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
    </Badge>

    <Badge v-if="shared" variant="secondary" class="gap-1">
      ⭐ Destacados
      <button @click="$emit('update:shared', false); $emit('shared-change', false)" class="ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
    </Badge>

    <Badge v-if="dateRange.start !== null" variant="secondary" class="gap-1">
      📅 {{ formatDateBadge() }}
      <button @click="$emit('update:dateRange', { start: null, end: null }); $emit('date-change', { start: null, end: null })" class="ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
    </Badge>
  </div>
</template>

<script setup lang="ts">
import type { ExpenseCategory } from '~/types'
import { getCategoryInfo } from '~/types'
import type { DateFilterRange } from '~/components/common/DateRangeFilter.vue'

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
}>()

const hasActiveFilters = computed(() => {
  return props.searchQuery !== '' || props.category !== 'all' || props.payment !== 'all' || props.shared || props.dateRange.start !== null
})

function formatDateBadge(): string {
  if (!props.dateRange.start) return ''

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  if (!props.dateRange.end || props.dateRange.start.getTime() === props.dateRange.end.getTime()) {
    return formatDate(props.dateRange.start)
  }

  return `${formatDate(props.dateRange.start)} - ${formatDate(props.dateRange.end)}`
}
</script>
