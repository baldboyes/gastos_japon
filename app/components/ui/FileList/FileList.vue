<script setup lang="ts">
import { FileText, Image, Download, Loader2 } from 'lucide-vue-next'
import { useDirectus } from '~/composables/useDirectus'
import { ref } from 'vue'

const props = defineProps<{
  files: any[]
}>()

const { token } = useDirectus()
const downloadingId = ref<string | null>(null)

const getFileIcon = (type: string) => {
  if (type?.startsWith('image/')) return Image
  return FileText
}

const handleDownload = async (fileId: string, filename: string) => {
  if (!fileId || downloadingId.value) return
  downloadingId.value = fileId
  
  try {
    // Método seguro: enviamos el token en el Header, no en la URL
    const response = await fetch(`https://api.mevoyajapon.com/assets/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    if (!response.ok) throw new Error('Fallo en la descarga')
    
    // Convertimos la respuesta a un objeto Blob (binario)
    const blob = await response.blob()
    
    // Creamos una URL temporal de tipo blob que solo existe en esta sesión del navegador
    const url = window.URL.createObjectURL(blob)
    
    // Simulamos un click en un enlace invisible para forzar la descarga
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'archivo'
    document.body.appendChild(a)
    a.click()
    
    // Limpiamos la URL temporal y el elemento del DOM
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (e) {
    console.error('Error al descargar el archivo:', e)
  } finally {
    downloadingId.value = null
  }
}
</script>

<template>
  <div v-if="files && files.length > 0" class="flex flex-wrap gap-2 mt-3">
    <div 
      v-for="item in files" 
      :key="item.id" 
      class="group flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border text-sm shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
      @click="handleDownload(item.directus_files_id?.id, item.directus_files_id?.filename_download)"
    >
      <Loader2 v-if="downloadingId === item.directus_files_id?.id" class="h-4 w-4 animate-spin text-blue-500" />
      <component v-else :is="getFileIcon(item.directus_files_id?.type)" class="h-4 w-4 text-blue-500" />
      
      <span 
        class="group-hover:text-blue-600 truncate max-w-[200px] font-medium transition-colors"
        :title="item.directus_files_id?.filename_download"
      >
        {{ item.directus_files_id?.title || item.directus_files_id?.filename_download }}
      </span>
      <Download class="h-3 w-3 text-slate-300 group-hover:text-blue-400 ml-1 opacity-0 group-hover:opacity-100 transition-all" />
    </div>
  </div>
</template>
