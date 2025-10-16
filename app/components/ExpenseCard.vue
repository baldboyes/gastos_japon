<template>
  <Card class="hover:shadow-md transition-shadow cursor-pointer" @click="$emit('click', expense)">
    <CardContent class="p-4">
      <div class="flex items-start gap-3">
        <!-- Category Icon -->
        <div
          class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          :class="categoryInfo.color"
        >
          {{ categoryInfo.icon }}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h3 class="font-semibold text-slate-900 truncate">
              {{ expense.placeName }}
            </h3>
            <div class="flex-shrink-0 font-bold text-slate-900">
              {{ formatYen(expense.amount) }}
            </div>
          </div>

          <!-- Time and Location -->
          <div class="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <div class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ formatTime(expense.timestamp) }}</span>
            </div>
            <span class="text-slate-400">•</span>
            <div class="flex items-center gap-1 truncate">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span class="truncate">{{ expense.location.city }}</span>
            </div>
          </div>

          <!-- Tags -->
          <div class="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" class="text-xs">
              {{ categoryInfo.label }}
            </Badge>
            <Badge
              variant="outline"
              class="text-xs"
              :class="expense.paymentMethod === 'cash' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'"
            >
              {{ expense.paymentMethod === 'cash' ? '💴 Cash' : '💳 Card' }}
            </Badge>
            <Badge v-if="expense.shared" variant="outline" class="text-xs border-purple-300 text-purple-700">
              👥 Shared
            </Badge>
          </div>

          <!-- Notes (if present) -->
          <p v-if="expense.notes" class="text-sm text-slate-600 mt-2 line-clamp-2">
            {{ expense.notes }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { Expense } from '~/types'
import { getCategoryInfo } from '~/types'
import { formatYen } from '~/utils/currency'
import { formatTime } from '~/utils/dates'

interface Props {
  expense: Expense
}

const props = defineProps<Props>()

defineEmits<{
  click: [expense: Expense]
}>()

const categoryInfo = computed(() => getCategoryInfo(props.expense.category))
</script>
