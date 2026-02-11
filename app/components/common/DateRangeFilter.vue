<template>
  <div class="space-y-2">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="cn(
            'w-full justify-start text-left font-normal bg-white',
            !hasDateFilter && 'text-muted-foreground'
          )"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
          <span v-if="!hasDateFilter">Seleccionar fechas</span>
          <span v-else-if="isSingleDay">{{ dateRange.start ? formatDate(dateRange.start) : '' }}</span>
          <span v-else>
            {{ dateRange.start ? formatDate(dateRange.start) : '' }} - {{ dateRange.end ? formatDate(dateRange.end) : '' }}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <div class="p-3 border-b">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              :class="dateMode === 'single' ? 'bg-teal-50 text-teal-700' : ''"
              @click="setDateMode('single')"
            >
              Fecha única
            </Button>
            <Button
              variant="ghost"
              size="sm"
              :class="dateMode === 'range' ? 'bg-teal-50 text-teal-700' : ''"
              @click="setDateMode('range')"
            >
              Rango
            </Button>
          </div>
        </div>

        <div class="p-3 w-full">
          <Calendar
            v-if="dateMode === 'single'"
            key="single-calendar"
            v-model="singleDate"
            locale="es-ES"
            :week-starts-on="1"
            @update:model-value="handleSingleDateChange"
          />
          <RangeCalendar
            v-else
            key="range-calendar"
            :model-value="rangeDates"
            locale="es-ES"
            :week-starts-on="1"
            @update:model-value="handleRangeDateChange"
          />
        </div>

        <div class="p-3 border-t flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            @click="clearDates"
          >
            Limpiar
          </Button>
          <Button
            size="sm"
            @click="applyDates"
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { cn } from '@/lib/utils'
import type { DateValue } from '@internationalized/date'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import { RangeCalendar } from '@/components/ui/range-calendar'

export interface DateFilterRange {
  start: Date | null
  end: Date | null
}

interface DateRangeValue {
  start: DateValue | undefined
  end: DateValue | undefined
}

const emit = defineEmits<{
  'date-change': [range: DateFilterRange]
}>()

const isOpen = ref(false)
const dateMode = ref<'single' | 'range'>('single')
const singleDate = ref<DateValue | undefined>()
const rangeDates = ref<DateRangeValue | undefined>()

const dateRange = ref<DateFilterRange>({
  start: null,
  end: null
})

const hasDateFilter = computed(() => dateRange.value.start !== null)

const isSingleDay = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return false
  const start = new Date(dateRange.value.start)
  const end = new Date(dateRange.value.end)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return start.getTime() === end.getTime()
})

function setDateMode(mode: 'single' | 'range') {
  dateMode.value = mode
  // Reset selections when changing mode
  singleDate.value = undefined
  rangeDates.value = undefined
}

function handleSingleDateChange(date: DateValue | undefined) {
  singleDate.value = date
}

function handleRangeDateChange(dates: DateRangeValue | undefined) {
  rangeDates.value = dates
}

// Convert DateValue to JavaScript Date
function dateValueToDate(dateValue: DateValue): Date {
  return new Date(dateValue.year, dateValue.month - 1, dateValue.day)
}

function applyDates() {
  if (dateMode.value === 'single') {
    if (singleDate.value) {
      // Set to start of day for start, end of day for end
      const start = dateValueToDate(singleDate.value)
      start.setHours(0, 0, 0, 0)
      const end = dateValueToDate(singleDate.value)
      end.setHours(23, 59, 59, 999)

      dateRange.value = { start, end }
      emit('date-change', dateRange.value)
    }
  } else {
    if (rangeDates.value?.start && rangeDates.value?.end) {
      const start = dateValueToDate(rangeDates.value.start)
      start.setHours(0, 0, 0, 0)
      const end = dateValueToDate(rangeDates.value.end)
      end.setHours(23, 59, 59, 999)

      dateRange.value = { start, end }
      emit('date-change', dateRange.value)
    }
  }
  isOpen.value = false
}

function clearDates() {
  singleDate.value = undefined
  rangeDates.value = undefined
  dateRange.value = { start: null, end: null }
  emit('date-change', dateRange.value)
  isOpen.value = false
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}
</script>