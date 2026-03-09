<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useI18n } from '#imports'

interface User {
  first_name?: string
  last_name?: string
  avatar?: string // UUID
  avatar_url?: string // External URL
  moneda?: string // Currency
  [key: string]: any
}

const props = withDefaults(defineProps<{
  user?: User | null
  size?: 'sm' | 'base' | 'lg' | 'xl'
  showName?: boolean
}>(), {
  size: 'base',
  showName: false
})

const { t } = useI18n()

const initials = computed(() => {
  if (!props.user) return '?'
  const first = props.user.first_name?.charAt(0) || ''
  const last = props.user.last_name?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
})

const avatarSrc = computed(() => {
  if (!props.user) return ''
  const raw = (props.user.avatar_url || '').replace(/[`\s]/g, '')
  if (!raw) return ''
  return raw
})

const fullName = computed(() => {
  if (!props.user) return String(t('common.user.unknown'))
  return `${props.user.first_name || ''} ${props.user.last_name || ''}`.trim()
})
</script>

<template>
  <div class="flex items-center gap-2" :title="fullName">
    <Avatar :size="size" class="border-2 border-white bg-white shadow-sm">
      <AvatarImage v-if="avatarSrc" :src="avatarSrc" :alt="fullName" />
      <AvatarFallback class="bg-teal-100 text-teal-700 font-medium">{{ initials }}</AvatarFallback>
    </Avatar>
    <span v-if="showName" class="text-sm font-medium text-neutral-700">
      {{ fullName }}
    </span>
  </div>
</template>
