<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { fileUrl } from '~/utils/directusFiles'
import { useDirectus } from '~/composables/useDirectus'

const props = defineProps<{
  src: string | null | undefined
  alt?: string
  class?: string
}>()

const emit = defineEmits(['error'])

const imageUrl = ref<string | undefined>(undefined)
const loading = ref(false)
const { token } = useDirectus()

const loadImage = async () => {
  if (!props.src) {
    imageUrl.value = undefined
    return
  }

  const url = fileUrl(props.src)
  if (!url) return

  // Si no hay token, usar URL directa (puede fallar si es privado)
  if (!token.value) {
    imageUrl.value = url
    return
  }

  loading.value = true
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (!response.ok) throw new Error('Failed to load image')

    const blob = await response.blob()
    imageUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.error('Error loading secure image:', e)
    emit('error', e)
    // Fallback a URL directa por si acaso es pública
    imageUrl.value = url
  } finally {
    loading.value = false
  }
}

watch(() => props.src, loadImage)
onMounted(loadImage)

// Limpieza de URL object
onUnmounted(() => {
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value)
  }
})
</script>

<template>
  <img 
    v-if="imageUrl" 
    :src="imageUrl" 
    :alt="alt" 
    :class="props.class"
    @error="$emit('error', $event)"
  />
  <div v-else-if="loading" :class="[props.class, 'animate-pulse bg-muted']"></div>
</template>
