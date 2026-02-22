<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: string
  collapsible?: 'offcanvas' | 'icon' | 'none'
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
}>()

const { state, open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar()

const sidebarState = computed(() => state.value)
</script>

<template>
  <div
    v-if="collapsible === 'none'"
    :class="cn('flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground', props.class)"
  >
    <slot />
  </div>

  <div
    v-else-if="isMobile"
    :class="cn('fixed inset-y-0 z-50 flex h-full w-[--sidebar-width] flex-col bg-sidebar p-6 shadow-xl transition-transform duration-300 ease-in-out',
      openMobile ? 'translate-x-0' : '-translate-x-full',
      props.side === 'right' ? 'right-0' : 'left-0',
      props.class
    )"
  >
    <slot />
  </div>

  <div
    v-else
    class="group peer hidden md:block text-sidebar-foreground"
    :data-state="sidebarState"
    :data-collapsible="sidebarState === 'collapsed' ? collapsible : ''"
    :data-variant="variant"
    :data-side="side"
  >
    <div
      :class="cn(
        'duration-200 relative h-svh w-[--sidebar-width] bg-sidebar transition-[width] ease-linear',
        'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
        'group-data-[side=left]:border-r group-data-[side=right]:border-l',
        props.class
      )"
    >
      <div
        class="flex h-full w-full flex-col bg-sidebar group-data-[collapsible=icon]:overflow-hidden"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
