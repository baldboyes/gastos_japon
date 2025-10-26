<template>
  <Card class="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-amber-300 bg-amber-50/30" @click="$emit('click', plannedExpense)">
    <CardContent class="px-4">
      <div class="flex items-start gap-3">
        <!-- Category Icon -->
        <div
          class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl opacity-70"
          :class="categoryInfo.color"
        >
          {{ categoryInfo.icon }}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h3 class="font-semibold text-gray-700 truncate">
              {{ plannedExpense.placeName }}
            </h3>
            <div class="flex-shrink-0 font-bold text-gray-700">
              {{ formatAmount(plannedExpense.amount) }}
            </div>
          </div>
          <div class="flex items-center gap-2 justify-between">
            <!-- Location -->
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <div class="flex items-center gap-1 truncate">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span class="truncate">{{ plannedExpense.location.city }}</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                class="text-xs opacity-80"
                :class="{
                  'border-green-300 text-green-700': plannedExpense.paymentMethod === 'cash',
                  'border-blue-300 text-blue-700': plannedExpense.paymentMethod === 'card',
                  'border-orange-300 text-orange-700': plannedExpense.paymentMethod === 'ic'
                }"
              >
                {{ plannedExpense.paymentMethod === 'cash' ? '💴 Cash' : plannedExpense.paymentMethod === 'card' ? '💳 Card' : '🎫 IC' }}
              </Badge>
              <Badge v-if="plannedExpense.shared" variant="outline" class="text-xs border-yellow-400 text-yellow-600 opacity-80">
                ⭐
              </Badge>
            </div>
          </div>
          <!-- Notes (if present) -->
          <p v-if="plannedExpense.notes" class="text-sm text-gray-600 mt-2 line-clamp-2 opacity-80">
            {{ plannedExpense.notes }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { PlannedExpense } from '~/types'
import { getCategoryInfo } from '~/types'

const { formatAmount } = useCurrency()

interface Props {
  plannedExpense: PlannedExpense
}

const props = defineProps<Props>()

defineEmits<{
  click: [plannedExpense: PlannedExpense]
}>()

const categoryInfo = computed(() => getCategoryInfo(props.plannedExpense.category))
</script>
