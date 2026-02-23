<script setup lang="ts">
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Plus, Save, ArrowRight, Clock } from 'lucide-vue-next'
import TextEditor from '~/components/ui/TextEditor.vue'
import { useDayNotes } from '~/composables/useDayNotes'
import { watch } from 'vue'

const props = defineProps<{
  events: ItineraryDayEvent[]
  date: Date
  tripId?: string | number
}>()

const emit = defineEmits<{
  (e: 'create-expense'): void
}>()

const { note, loading: noteLoading, saving: noteSaving, fetchNote, saveNote } = useDayNotes()

const loadNote = () => {
  if (props.tripId && props.date) {
    fetchNote(props.tripId, props.date)
  }
}

const handleSaveNote = () => {
  if (props.tripId && props.date) {
    saveNote(props.tripId, props.date, note.value)
  }
}

watch(() => props.date, loadNote, { immediate: true })

const getDayLabel = (date: Date) => format(date, 'd', { locale: es })
const getDayName = (date: Date) => format(date, 'EEEE', { locale: es })
const getMonthLabel = (date: Date) => format(date, 'MMM', { locale: es })
</script>

<template>
  <div class="flex-1 p-4 md:p-8 relative">
    <div class="max-w-3xl mx-auto space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold flex items-center gap-2">
          {{ getDayName(date) }}, {{ getDayLabel(date) }} de {{ getMonthLabel(date) }}
        </h2>
        <!--
        <Button @click="emit('create-expense')">
          <Plus class="mr-2 h-4 w-4" /> Nuevo Gasto
        </Button>
        -->
      </div>
      <div v-if="events.length === 0" class="text-center py-12 border rounded-lg bg-white border-dashed text-muted-foreground">
        <Clock class="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 class="text-lg font-semibold text-slate-700">Sin planes para este día</h3>
        <p>No hay actividades, trayectos ni tareas programadas.</p>
      </div>
      <div v-else class="space-y-4">
        <div v-for="event in events" :key="event.id" class="relative group">
          <!-- Special "Noche en" sticky header-like card -->
          <div 
            v-if="event.type === 'accommodation_stay'" 
            class="bg-slate-800 border-slate-700 text-white !border-l-blue-400 !border-l-4 py-4 px-4 rounded-2xl"
          >
            <div class="w-full h-full flex flex-col justify-between transition-colors">
              <div class="flex justify-start items-start w-full mb-1 gap-4">
                <div class="h-10 w-10 rounded-full shrink-0 bg-opacity-10 flex items-center justify-center bg-slate-700 text-slate-200">
                  <component :is="event.icon" class="h-4 w-4 text-slate-200" />
                </div>
                <div class="min-w-0">
                  <h4 class="font-semibold text-sm">{{ event.title }}</h4>
                  <p v-if="event.subtitle" class="text-xs text-slate-400 mt-0 truncate">{{ event.subtitle }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Active Pass sticky header-like card -->
          <div 
            v-else-if="event.type === 'transport_pass_active'" 
            class="bg-green-700 border-green-600 text-white !border-l-green-400 !border-l-4 py-4 px-4 rounded-2xl"
          >
            <div class="w-full h-full flex flex-col justify-between transition-colors">
              <div class="flex justify-start items-start w-full mb-1 gap-4">
                <div class="h-10 w-10 rounded-full shrink-0 bg-opacity-10 flex items-center justify-center bg-green-600 text-green-100">
                  <component :is="event.icon" class="h-4 w-4 text-green-100" />
                </div>
                <div class="min-w-0">
                  <h4 class="font-semibold text-sm">{{ event.title }}</h4>
                  <p v-if="event.subtitle" class="text-xs text-green-200 mt-0 truncate">{{ event.subtitle }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Priority Group Row (Check-in/Out) -->
          <div v-else-if="event.type === 'accommodation_transition_group'" class="flex gap-4">
            <div 
              v-for="subEvent in event.items" 
              :key="subEvent.id"
              class=" !border-l-blue-400 !border-l-4 py-4 px-4 rounded-2xl"
              :class="[
                event.items.length > 1 ? 'w-1/2' : 'w-full',
                subEvent.type === 'accommodation_checkin' 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-white border-slate-200 text-slate-900'
              ]"
            >
              <div class="w-full h-full flex flex-col justify-between transition-colors">
                <div class="flex justify-between items-start w-full mb-1 gap-2">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="h-10 w-10 rounded-full shrink-0 bg-opacity-10 flex items-center justify-center" :class="subEvent.type === 'accommodation_checkin' ? 'bg-slate-700 text-slate-200' : subEvent.colorClass">
                      <component :is="subEvent.icon" class="h-5 w-5" />
                    </div>
                    <div class="-space-y-0.5 min-w-0 flex-1">
                      <div class="font-semibold truncate text-sm" :class="subEvent.type === 'accommodation_checkin' ? 'text-white' : 'text-slate-900'" :title="subEvent.title">
                        {{ subEvent.title.replace('Check-in: ', '').replace('Check-out: ', '') }}
                      </div>
                      <p class="text-xs truncate uppercase font-bold tracking-wider" :class="subEvent.type === 'accommodation_checkin' ? 'text-slate-400' : 'text-slate-500'">
                        {{ subEvent.type === 'accommodation_checkin' ? 'Check-in' : 'Check-out' }}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    class="font-mono text-[10px] px-1 h-5 shrink-0"
                    :class="subEvent.type === 'accommodation_checkin' ? 'border-slate-900' : ''"
                  >
                    {{ subEvent.time }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <!-- Standard Event Card -->
          <div v-else class="mb-3 overflow-hidden !border-l-4 py-4 px-4 rounded-2xl bg-white" 
            :class="event.type === 'flight' ? 'border-l-blue-400' : event.type === 'accommodation' || event.type === 'hotel' ? 'border-l-blue-400' : event.type === 'activity' ? 'border-l-purple-400' : event.type === 'expense' ? 'border-l-red-400' : event.type === 'task' ? 'border-l-yellow-400' : 'border-l-green-400'">
            <div class="p-0 flex items-start gap-4">
              <div class="h-10 w-10 rounded-full shrink-0 bg-opacity-10 flex items-center justify-center" :class="event.colorClass">
                <component :is="event.icon" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                  <h4 class="font-semibold text-slate-900 truncate pr-2 flex items-center">
                    <template v-if="event.title.includes('➝')">
                      {{ event.title.split('➝')[0] }} 
                      <ArrowRight class="h-4 w-4 text-muted-foreground mx-1" />
                      {{ event.title.split('➝')[1] }}
                    </template>
                    <template v-else>
                      {{ event.title }}
                    </template>
                  </h4>
                  <Badge variant="outline" class="font-mono text-xs">
                    {{ event.time }}
                    <sup v-if="event.dayDiff" class="text-red-500 font-bold ml-0.5">{{ event.dayDiff }}</sup>
                  </Badge>
                </div>
                <p v-if="event.subtitle" class="text-sm text-slate-500 mt-0.5 truncate">{{ event.subtitle }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-8 mb-8 pt-6">
          <div class="flex items-center justify-between z-50 absolute">
            <h3 class="text-lg font-semibold text-slate-800">Plan</h3>
          </div>
          <div class="sticky -top-8 h-8 bg-gray-50 z-40"></div>
          <TextEditor 
            v-model="note" 
            placeholder="Escribe aquí tus notas, diario o recordatorios para este día..." 
            :read-only="noteLoading"
            :loading="noteSaving"
            sticky-top="0px"
            @save="handleSaveNote"
          />
        </div>
      </div>
    </div>
  </div>
</template>
