<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, ChevronsUpDown, Coins, Search } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { CURRENCIES } from '~/composables/useSettings'
import type { Currency } from '~/types'

const props = defineProps<{ modelValue?: Currency }>()
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const searchQuery = ref('')

const filteredCurrencies = computed(() => {
  const query = searchQuery.value.toLowerCase()
  
  const list = query 
    ? CURRENCIES.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.code.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query)
      )
    : [...CURRENCIES]

  return list.sort((a, b) => a.name.localeCompare(b.name))
})

const selectedCurrency = computed(() => 
  CURRENCIES.find(c => c.code === props.modelValue)
)

const selectCurrency = (code: Currency) => {
  emit('update:modelValue', code)
  open.value = false
  searchQuery.value = ''
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full justify-between border-input hover:bg-white focus-visible:border-ring focus-visible:ring-ring/50 h-14"
      >
        <div class="flex items-center gap-3 truncate w-full">
          <span v-if="selectedCurrency?.flag" class="text-2xl leading-none">{{ selectedCurrency.flag }}</span>
          <Coins v-else class="h-5 w-5 opacity-50" />
          
          <div class="flex flex-col items-start text-left leading-tight truncate">
             <span class="font-semibold truncate">{{ selectedCurrency?.name || "Seleccionar moneda..." }}</span>
             <span class="text-xs text-muted-foreground" v-if="selectedCurrency">
                {{ selectedCurrency.code }} ({{ selectedCurrency.symbol }})
             </span>
          </div>
        </div>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[300px] p-0" align="start">
      <div class="p-2 border-b border-gray-200">
        <div class="flex items-center px-2 border border-input rounded-md">
          <Search class="h-4 w-4 text-muted-foreground mr-2" />
          <input 
            v-model="searchQuery"
            class="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-input hover:bg-white focus-visible:border-ring focus-visible:ring-ring/50"
            placeholder="Buscar moneda..."
          />
        </div>
      </div>
      
      <div class="max-h-[300px] overflow-y-auto p-2">
        <div v-if="filteredCurrencies.length === 0" class="p-4 text-center text-sm text-muted-foreground">
          No encontrada.
        </div>
        <div
          v-for="currency in filteredCurrencies"
          :key="currency.code"
          @click="selectCurrency(currency.code)"
          :class="cn(
            'relative flex select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer mb-1',
            modelValue === currency.code ? 'bg-accent' : ''
          )"
        >
          <Check
            :class="cn(
              'mr-2 h-4 w-4',
              modelValue === currency.code ? 'opacity-100' : 'opacity-0'
            )"
          />
          <div class="flex items-center gap-3 w-full">
            <span class="text-2xl leading-none">{{ currency.flag }}</span>
            <div class="flex flex-col items-start text-left leading-tight">
               <span class="font-medium">{{ currency.name }}</span>
               <span class="text-xs text-muted-foreground">{{ currency.code }} ({{ currency.symbol }})</span>
            </div>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
