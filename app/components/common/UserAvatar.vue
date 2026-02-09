<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

interface User {
  first_name?: string
  last_name?: string
  avatar?: string // UUID
  avatar_url?: string // External URL
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

const initials = computed(() => {
  if (!props.user) return '?'
  const first = props.user.first_name?.charAt(0) || ''
  const last = props.user.last_name?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
})

const avatarSrc = computed(() => {
  if (!props.user) return ''
  const url = (props.user.avatar_url || '') + '?width=64'
  // Eliminar espacios y backticks si existen (limpieza de datos sucios)
  return url.replace(/[`\s]/g, '')
})

const fullName = computed(() => {
  if (!props.user) return 'Usuario desconocido'
  return `${props.user.first_name || ''} ${props.user.last_name || ''}`.trim()
})
</script>

<template>
  <div class="flex items-center gap-2" :title="fullName">
    <Avatar :size="size" class="border-2 border-white bg-white shadow-sm">
      <AvatarImage :src="avatarSrc" :alt="fullName" />
      <AvatarFallback class="bg-teal-100 text-teal-700 font-medium">{{ initials }}</AvatarFallback>
    </Avatar>
    <span v-if="showName" class="text-sm font-medium text-gray-700">
      {{ fullName }}
    </span>
  </div>
</template>
