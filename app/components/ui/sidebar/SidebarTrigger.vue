<script setup lang="ts">
import { useSidebar } from './utils'
import { Button } from '@/components/ui/button'
import { PanelLeft } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const { toggleSidebar } = useSidebar()
const props = defineProps<{ class?: string }>()
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :class="cn('h-7 w-7', props.class)"
    @click="toggleSidebar"
  >
    <PanelLeft />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
