<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { computed, ref, toRef, watch } from 'vue'
import {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
  provideSidebarContext,
} from './utils'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    defaultOpen?: boolean
    open?: boolean
    class?: string
  }>(),
  {
    defaultOpen: true,
    open: undefined,
  },
)

const emits = defineEmits<{
  'update:open': [value: boolean]
}>()

const isMobile = useMediaQuery('(max-width: 768px)')
const openMobile = ref(false)

const open = ref(props.defaultOpen)

// Sync with cookie if available (Nuxt specific)
const sidebarState = useCookie(SIDEBAR_COOKIE_NAME, {
  default: () => props.defaultOpen,
  maxAge: SIDEBAR_COOKIE_MAX_AGE,
})

// Initialize open state from cookie or default
if (sidebarState.value !== undefined) {
  open.value = sidebarState.value
}

function setOpen(value: boolean) {
  open.value = value
  emits('update:open', value)
  sidebarState.value = value
}

function setOpenMobile(value: boolean) {
  openMobile.value = value
}

function toggleSidebar() {
  return isMobile.value
    ? setOpenMobile(!openMobile.value)
    : setOpen(!open.value)
}

// Watch for external changes if controlled
watch(() => props.open, (val) => {
  if (val !== undefined) {
    open.value = val
  }
})

// Keyboard shortcut
if (import.meta.client) {
  window.addEventListener('keydown', (event) => {
    if (
      event.key === 'b' &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault()
      toggleSidebar()
    }
  })
}

const state = computed(() => open.value ? 'expanded' : 'collapsed')

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
})
</script>

<template>
  <div
    :class="cn('group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar', props.class)"
    :style="{
      '--sidebar-width': SIDEBAR_WIDTH,
      '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
    }"
  >
    <slot />
  </div>
</template>
