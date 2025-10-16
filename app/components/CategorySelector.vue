<template>
  <div>
    <Label class="text-base mb-3 block">Categoría *</Label>
    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="category in CATEGORIES"
        :key="category.key"
        type="button"
        class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
        :class="[
          selected === category.key
            ? 'border-teal-500 bg-teal-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        ]"
        @click="$emit('update:modelValue', category.key)"
      >
        <div class="text-3xl">{{ category.icon }}</div>
        <div class="text-xs font-medium text-center text-slate-700">
          {{ category.label }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExpenseCategory } from '~/types'
import { CATEGORIES } from '~/types'

interface Props {
  modelValue: ExpenseCategory
}

const props = defineProps<Props>()

const selected = computed(() => props.modelValue)

defineEmits<{
  'update:modelValue': [value: ExpenseCategory]
}>()
</script>
