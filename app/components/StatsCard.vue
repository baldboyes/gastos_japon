<template>
  <Card>
    <CardContent class="p-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="text-sm text-slate-600 mb-1">{{ label }}</div>
          <div class="text-2xl font-bold text-slate-900">{{ displayValue }}</div>
          <div v-if="subtitle" class="text-xs text-slate-500 mt-1">{{ subtitle }}</div>
        </div>
        <div
          v-if="icon"
          class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          :class="iconBgClass"
        >
          {{ icon }}
        </div>
      </div>

      <!-- Optional trend indicator -->
      <div v-if="trend !== undefined" class="mt-3 pt-3 border-t flex items-center gap-1 text-xs">
        <svg
          v-if="trend > 0"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-red-500"
        >
          <path d="m18 15-6-6-6 6"/>
        </svg>
        <svg
          v-else-if="trend < 0"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-green-500"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
        <span :class="trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-slate-600'">
          {{ trendText }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  subtitle?: string
  icon?: string
  iconBgClass?: string
  trend?: number
  trendText?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconBgClass: 'bg-slate-100'
})

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>
