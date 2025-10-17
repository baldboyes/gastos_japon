<template>
  <Card class="hover:shadow-md transition-shadow cursor-pointer" @click="$emit('click', expense)">
    <CardContent class="px-4">
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
            <h3 class="font-semibold text-gray-900 truncate">
              {{ expense.placeName }}
            </h3>
            <div class="flex-shrink-0 font-bold text-gray-900">
              {{ formatAmount(expense.amount) }}
            </div>
          </div>
          <div class="flex items-center gap-2 justify-between">
            <!-- Time and Location -->
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <div class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>{{ formatTime(expense.timestamp) }}</span>
              </div>

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
              <Badge
                variant="outline"
                class="text-xs"
                :class="{
                  'border-green-300 text-green-700': expense.paymentMethod === 'cash',
                  'border-blue-300 text-blue-700': expense.paymentMethod === 'card',
                  'border-orange-300 text-orange-700': expense.paymentMethod === 'ic'
                }"
              >
                {{ expense.paymentMethod === 'cash' ? '💴 Cash' : expense.paymentMethod === 'card' ? '💳 Card' : '🎫 IC' }}
              </Badge>
              <Badge v-if="expense.shared" variant="outline" class="text-xs border-purple-300 text-purple-700">
                👥
              </Badge>
            </div>
          </div>
          <!-- Notes (if present) -->
          <p v-if="expense.notes" class="text-sm text-gray-600 mt-2 line-clamp-2">
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
import { formatTime } from '~/utils/dates'

const { formatAmount } = useCurrency()

interface Props {
  expense: Expense
}

const props = defineProps<Props>()

defineEmits<{
  click: [expense: Expense]
}>()

const categoryInfo = computed(() => getCategoryInfo(props.expense.category))
</script>
