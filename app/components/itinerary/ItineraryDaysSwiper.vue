<script setup lang="ts">
  import { Swiper, SwiperSlide } from 'swiper/vue'
  import 'swiper/css'
  import 'swiper/css/free-mode'

import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plane, Sun, Cloud, CloudRain, Ticket } from 'lucide-vue-next'

const props = defineProps<{
  days: any[]
  selectedDate: Date
}>()

const emit = defineEmits<{
  (e: 'select', date: Date): void
}>()

const getDayLabel = (date: Date) => format(date, 'd', { locale: es })
const getDayName = (date: Date) => format(date, 'EEEE', { locale: es })
const getMonthLabel = (date: Date) => format(date, 'MMM', { locale: es })

const isSelected = (date: Date) => isSameDay(date, props.selectedDate)

const selectDate = (date: Date) => {
  emit('select', date)
}
</script>

<template>
  <div class="relative w-full min-w-0 overflow-hidden" style="width: 0; min-width: 100%;">
    <Swiper
      :slides-per-view="'auto'"
      :space-between="0"
      :free-mode="true"
      :mousewheel="true"
      class="w-full !pr-4"
    >
      <SwiperSlide
        v-for="(day, index) in days"
        :key="day.date.toISOString()"
        class="!w-40 relative overflow-visible p-4"
        :style="{ zIndex: days.length - index }"
      >
        <!-- Day Card -->
        <div class="p-0 !w-40 relative overflow-visible">
          <div 
            class="bg-white rounded-2xl shadow-md flex flex-col justify-start px-4 py-2 cursor-pointer transition-all relative w-36 h-32 overflow-visible"
            :class="isSelected(day.date) ? 'scale-110 shadow-lg z-10' : 'hover:shadow-md hover:scale-105'"
            @click="selectDate(day.date)"
          >
            <div class="flex flex-col items-start gap-0">
              <div class="flex items-baseline gap-0.75">
                <span class="text-2xl font-bold uppercase text-muted-foreground" :class="isSelected(day.date) ? 'text-orange-600' : 'text-slate-700'">{{ getDayLabel(day.date) }}</span>
                <span class="text-xs text-slate-500">{{ getMonthLabel(day.date) }}</span>
              </div>
              <span class="-mt-1 text-sm font-medium text-slate-600">{{ getDayName(day.date) }}</span>
            </div>
            
            <!-- Weather Mock -->
            <div class="absolute top-3 right-3">
                <Sun class="h-4 w-4 text-orange-400" v-if="index % 3 === 0" />
                <Cloud class="h-4 w-4 text-slate-400" v-else-if="index % 3 === 1" />
                <CloudRain class="h-4 w-4 text-blue-400" v-else />
            </div>
          </div>
        </div>
        <!-- Flights (Row 1) -->
        <div class="absolute top-13 left-0 w-full px-2 pointer-events-none z-50 flex flex-col items-end gap-1">
           <div v-for="flight in day.flights" :key="flight.id" class="flex justify-end">
              <Plane class="h-4 w-4 text-blue-600/80" />
           </div>
           <!-- Activities Indicators
           <div v-if="day.activities && day.activities.length > 0" class="flex gap-1">
              <Ticket v-for="act in day.activities" :key="act.id" class="h-4 w-4 text-purple-600/80" />
           </div>
          -->
        </div>

        <!-- Accommodations (Row 2) -->
        <div class="absolute top-[80px] left-12 w-full px-0 pointer-events-none z-50 h-6">
           <div 
             v-for="acc in day.accommodations" 
             :key="acc.id"
             class="h-full flex items-center px-2 text-sm font-medium transition-all"
             :class="[
               acc.colorClass,
               acc.status === 'start' ? 'rounded-l-md ml-1' : '',
               acc.status === 'end' ? 'rounded-r-md mr-1' : '',
               acc.status === 'single' ? 'rounded-md mx-1' : '',
               acc.status === 'middle' ? 'rounded-none mx-0' : '',
               acc.status === 'start' || acc.status === 'single' ? 'whitespace-nowrap overflow-visible' : 'truncate'
             ]"
             :style="acc.status === 'start' && acc.duration ? { maxWidth: `calc(100% * ${acc.duration})`, width: 'max-content', minWidth: '100%' } : {}"
           >
             <component :is="acc.icon" class="h-3 w-3 mr-1 shrink-0" v-if="acc.status === 'start' || acc.status === 'single'" />
             <span class="truncate" v-if="acc.status === 'start' || acc.status === 'single'">{{ acc.title }}</span>
           </div>
        </div>

        <!-- Passes (Row 3) -->
        <div class="absolute top-[110px] left-4 w-full px-0 pointer-events-none z-50 h-6">
           <div 
             v-for="pass in day.passes" 
             :key="pass.id"
             class="h-full flex items-center px-2 text-sm font-bold transition-all"
             :class="[
               pass.colorClass,
               pass.status === 'start' ? 'rounded-l-md ml-2' : '',
               pass.status === 'end' ? 'rounded-r-md mr-6' : '',
               pass.status === 'single' ? 'rounded-md mx-2' : '',
               pass.status === 'middle' ? 'rounded-none mx-0' : '',
               pass.status === 'start' || pass.status === 'single' ? 'whitespace-nowrap overflow-visible' : 'truncate'
             ]"
             :style="pass.status === 'start' && pass.duration ? { maxWidth: `calc(100% * ${pass.duration})`, width: 'max-content', minWidth: '100%' } : {}"
           >
             <component :is="pass.icon" class="h-3 w-3 mr-1 shrink-0" v-if="pass.status === 'start' || pass.status === 'single'" />
             <span class="truncate" v-if="pass.status === 'start' || pass.status === 'single'">{{ pass.title }}</span>
           </div>
        </div>

      </SwiperSlide>
    </Swiper>
  </div>
</template>
