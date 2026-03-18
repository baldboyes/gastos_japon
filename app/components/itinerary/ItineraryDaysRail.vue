<script setup lang="ts">
import { computed } from 'vue'
import { format, isSameDay, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plane, Ticket } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { ScrollArea } from '~/components/ui/scroll-area'

const props = defineProps<{
  days: any[]
  selectedDate: Date
  class?: string
}>()

const emit = defineEmits<{
  (e: 'select', date: Date): void
}>()

const getDayLabel = (date: Date) => format(date, 'd', { locale: es })
const getDayName = (date: Date) => format(date, 'EEE', { locale: es })
const getMonthLabel = (date: Date) => format(date, 'MMM', { locale: es })

const items = computed(() => Array.isArray(props.days) ? props.days : [])

const isSelected = (date: Date) => isSameDay(date, props.selectedDate)

const showItemLabel = (status?: string) => status === 'start' || status === 'single'

const getPrimaryDestination = (day: any) => {
  const list = Array.isArray(day?.destinations) ? day.destinations : []
  return list.length > 0 ? list[0] : null
}

const daySlotHeightPx = 80
const checkInRatio = 0.3
const transferGapRatio = 0.1

const dayIndexByKey = computed(() => {
  const map = new Map<string, number>()
  items.value.forEach((d: any, idx: number) => {
    const key = format(startOfDay(d.date), 'yyyy-MM-dd')
    map.set(key, idx)
  })
  return map
})

const citySegments = computed(() => {
  const segs: Array<{ key: string, title: string, topPx: number, heightPx: number, roundedClass: string }> = []
  const gapPx = 4
  let currentTitle = ''
  let startIdx = 0

  const push = (title: string, from: number, to: number) => {
    if (!title) return
    const baseTopPx = from * daySlotHeightPx
    const baseHeightPx = (to - from + 1) * daySlotHeightPx
    const topTrim = from > 0 ? gapPx / 2 : 0
    const bottomTrim = to < items.value.length - 1 ? gapPx / 2 : 0
    const topPx = baseTopPx + topTrim
    const heightPx = Math.max(0, baseHeightPx - topTrim - bottomTrim)
    const roundedClass = 'rounded-t-md rounded-b-md'
    segs.push({ key: `${title}-${from}-${to}`, title, topPx, heightPx, roundedClass })
  }

  items.value.forEach((day: any, idx: number) => {
    const title = getPrimaryDestination(day)?.title || ''
    if (idx === 0) {
      currentTitle = title
      startIdx = 0
      return
    }
    if (title !== currentTitle) {
      push(currentTitle, startIdx, idx - 1)
      currentTitle = title
      startIdx = idx
    }
  })
  push(currentTitle, startIdx, items.value.length - 1)
  return segs
})

const passSegments = computed(() => {
  const uniq = new Map<string, any>()
  for (const day of items.value) {
    const list = Array.isArray(day?.passes) ? day.passes : []
    for (const pass of list) {
      if (!pass?.id) continue
      uniq.set(String(pass.id), pass)
    }
  }

  const segs: Array<{ key: string, topPx: number, heightPx: number, roundedClass: string, pass: any }> = []
  for (const pass of uniq.values()) {
    if (!pass?.start_date || !pass?.end_date) continue
    const startKey = format(startOfDay(parseISO(String(pass.start_date))), 'yyyy-MM-dd')
    const endKey = format(startOfDay(parseISO(String(pass.end_date))), 'yyyy-MM-dd')
    const startIdx = dayIndexByKey.value.get(startKey)
    const endIdx = dayIndexByKey.value.get(endKey)
    if (startIdx === undefined || endIdx === undefined) continue
    if (endIdx < startIdx) continue

    const topPx = startIdx * daySlotHeightPx
    const heightPx = (endIdx - startIdx + 1) * daySlotHeightPx
    const roundedClass = 'rounded-t-md rounded-b-md'
    segs.push({ key: `pass-${pass.id}-${startKey}-${endKey}`, topPx, heightPx, roundedClass, pass })
  }
  return segs
})

const accommodationRanges = computed(() => {
  const uniq = new Map<string, any>()
  for (const day of items.value) {
    const list = Array.isArray(day?.accommodations) ? day.accommodations : []
    for (const acc of list) {
      if (!acc?.id) continue
      uniq.set(String(acc.id), acc)
    }
  }

  const ranges: Array<{ key: string, topPx: number, heightPx: number, acc: any, blocks: Array<{ key: string, topPx: number, heightPx: number, roundedClass: string }> }> = []
  const startOffsetPx = Math.round(daySlotHeightPx * (checkInRatio + transferGapRatio))
  const carryHeightPx = Math.round(daySlotHeightPx * checkInRatio)

  for (const acc of uniq.values()) {
    if (!acc?.check_in || !acc?.check_out) continue
    const checkInKey = format(startOfDay(parseISO(String(acc.check_in))), 'yyyy-MM-dd')
    const checkOutKey = format(startOfDay(parseISO(String(acc.check_out))), 'yyyy-MM-dd')
    const checkInIdx = dayIndexByKey.value.get(checkInKey)
    const checkOutIdx = dayIndexByKey.value.get(checkOutKey)
    if (checkInIdx === undefined || checkOutIdx === undefined) continue
    if (checkOutIdx < checkInIdx) continue

    const rangeTopPx = checkInIdx * daySlotHeightPx + startOffsetPx
    const rangeBottomPx = checkOutIdx * daySlotHeightPx + carryHeightPx
    const rangeHeightPx = rangeBottomPx - rangeTopPx
    if (rangeHeightPx <= 0) continue

    const blocks: Array<{ key: string, topPx: number, heightPx: number, roundedClass: string }> = []
    for (let i = checkInIdx; i <= checkOutIdx; i++) {
      const dayTopAbs = i * daySlotHeightPx
      const dayTopRel = dayTopAbs - rangeTopPx
      const topPx = i === checkInIdx ? 0 : dayTopRel
      const heightPx = i === checkInIdx
        ? (daySlotHeightPx - startOffsetPx)
        : (i === checkOutIdx ? carryHeightPx : daySlotHeightPx)

      const roundedClass = `${i === checkInIdx ? 'rounded-t-md' : ''} ${i === checkOutIdx ? 'rounded-b-md' : ''}`.trim()
      blocks.push({ key: `acc-block-${acc.id}-${i}`, topPx, heightPx, roundedClass })
    }

    ranges.push({
      key: `acc-range-${acc.id}-${checkInKey}-${checkOutKey}`,
      topPx: rangeTopPx,
      heightPx: rangeHeightPx,
      acc,
      blocks
    })
  }

  ranges.sort((a, b) => a.topPx - b.topPx)
  return ranges
})
</script>

<template>
  <ScrollArea :class="cn('w-full', props.class)">
    <div class="relative w-full lg:pr-2">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-y-0 right-3 w-16">
          <div
            v-for="seg in citySegments"
            :key="seg.key"
            class="absolute inset-x-0 bg-neutral-300"
            :style="{ top: `${seg.topPx}px`, height: `${seg.heightPx}px` }"
            :class="seg.roundedClass"
          >
            <div class="sticky top-2 z-10 ml-auto w-6 h-24 bg-transparent text-neutral-700 flex items-center justify-end pr-0">
              <span class="inline-block -rotate-90 whitespace-nowrap text-[11px] font-bold">
                {{ seg.title }}
              </span>
            </div>
          </div>
        </div>

        <div class="absolute inset-y-0 right-24 w-7 z-50">
          <div
            v-for="seg in passSegments"
            :key="seg.key"
            class="absolute inset-x-0"
            :style="{ top: `${seg.topPx}px`, height: `${seg.heightPx}px` }"
          >
            <div class="absolute inset-0 overflow-hidden">
              <div :class="[seg.pass.colorClass, seg.roundedClass]" class="absolute inset-0" />
            </div>

            <div class="sticky top-0 z-10 left-0 right-0 flex justify-center">
              <span
                class="inline-block whitespace-nowrap text-[10px] font-bold leading-none text-white px-4"
                :style="{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed' }"
              >
                {{ seg.pass.title }}
              </span>
            </div>
          </div>
        </div>

        <div class="absolute inset-y-0 right-14 w-8 z-50">
          <div
            v-for="range in accommodationRanges"
            :key="range.key"
            class="absolute inset-x-0"
            :style="{ top: `${range.topPx}px`, height: `${range.heightPx}px` }"
          >
            <div class="absolute inset-0 overflow-hidden">
              <div
                v-for="block in range.blocks"
                :key="block.key"
                class="absolute inset-x-0"
                :style="{ top: `${block.topPx}px`, height: `${block.heightPx}px` }"
                :class="[range.acc.colorClass, block.roundedClass]"
              />
            </div>

            <div class="sticky top-0 z-10 left-0 right-0 flex justify-center">
              <span
                class="inline-block whitespace-nowrap text-[10px] font-medium leading-none text-white px-4"
                :style="{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', textOrientation: 'mixed' }"
              >
                {{ range.acc.title }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-for="(day, index) in items"
        :key="day.date && day.date.toISOString ? day.date.toISOString() : String(day.date)"
        class="relative h-20"
        :style="{ zIndex: items.length - index }"
      >

        <button
          type="button"
          @click="emit('select', day.date)"
          class="relative w-full text-left"
        >
          <div
            class="ml-2 mr-8 mt-1.5 mb-0 rounded-2xl bg-white shadow-md flex flex-col justify-start px-4 py-4 cursor-pointer transition-all relative overflow-visible h-[calc(100%-14px)]"
            :class="isSelected(day.date) ? 'shadow-lg ring-2 ring-inset ring-red-400 scale-y-110 scale-x-105' : 'hover:shadow-md'"
          >
            <div class="flex flex-col items-start gap-0">
              <div class="flex items-center gap-2">
                <span class="text-2xl font-bold uppercase text-muted-foreground" :class="isSelected(day.date) ? 'text-orange-600' : 'text-slate-700'">
                  {{ getDayLabel(day.date) }}
                </span>
                <div class="flex flex-col items-start gap-0.75">
                  <span class="text-xs text-slate-500">{{ getMonthLabel(day.date) }}</span>
                  <span class="-mt-1.5 text-sm font-medium text-slate-600">{{ getDayName(day.date) }}</span>
                </div>
              </div>
              
            </div>
            <div class="absolute top-4 left-22 flex gap-1">
              <Plane v-if="day.flights?.length" class="h-4 w-4 text-blue-600/80" />
              <Ticket v-if="day.activities?.length" class="h-4 w-4 text-purple-600/80" />
            </div>
          </div>
        </button>
      </div>
    </div>
  </ScrollArea>
</template>
