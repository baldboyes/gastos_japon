<script setup lang="ts">
import { FileText, Image, Download, Loader2, Trash2, Search } from 'lucide-vue-next'
import { useDirectus } from '~/composables/useDirectus'
import { useDirectusFiles } from '~/composables/useDirectusFiles'
import { ref, computed } from 'vue'
import { Input } from '~/components/ui/input'
import { toast } from 'vue-sonner'

const props = defineProps<{
  files: any[],
  collection: string
}>()

const emit = defineEmits(['deleted'])

const { token } = useDirectus()
const { removeFile } = useDirectusFiles()
const downloadingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const searchQuery = ref('')
const fileToDelete = ref<{fileId: string, junctionId: number | string} | null>(null)
const isDeleteDialogOpen = ref(false)

const filteredFiles = computed(() => {
    if (!props.files) return []
    if (!searchQuery.value) return props.files
    
    const query = searchQuery.value.toLowerCase()
    return props.files.filter(item => {
        const title = item.directus_files_id?.title || ''
        const filename = item.directus_files_id?.filename_download || ''
        return title.toLowerCase().includes(query) || filename.toLowerCase().includes(query)
    })
})

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
    toast.error('Error al descargar el archivo')
  } finally {
    downloadingId.value = null
  }
}

const confirmDelete = (fileId: string, junctionId: number | string) => {
    fileToDelete.value = { fileId, junctionId }
    isDeleteDialogOpen.value = true
}

const handleDelete = async () => {
    if (!fileToDelete.value) return

    const { fileId, junctionId } = fileToDelete.value
    deletingId.value = fileId
    
    try {
        await removeFile(props.collection, junctionId, fileId)
        toast.success('Archivo eliminado correctamente')
        emit('deleted')
    } catch (e) {
        toast.error('Error al eliminar el archivo')
    } finally {
        deletingId.value = null
        fileToDelete.value = null
        isDeleteDialogOpen.value = false
    }
}
</script>

<template>
  <div v-if="files && files.length > 0" class="mt-3 space-y-3">
<!-- Buscador (Solo si hay archivos)
    <div v-if="files.length > 0" class="relative">
       <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
       <Input v-model="searchQuery" placeholder="Buscar archivo..." class="pl-8 h-9 text-sm" />
    </div>
-->
    <div class="flex flex-wrap gap-2">
        <div 
        v-for="item in filteredFiles" 
        :key="item.id" 
        class="group flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border text-sm shadow-sm hover:bg-slate-50 transition-colors"
        >
        <!-- Icono Archivo -->
        <component :is="getFileIcon(item.directus_files_id?.type)" class="h-4 w-4 text-blue-500 shrink-0" />
        
        <!-- Nombre (Click para descargar) -->
        <span 
            class="group-hover:text-blue-600 truncate max-w-[200px] font-medium transition-colors cursor-pointer"
            :title="item.directus_files_id?.filename_download"
            @click="handleDownload(item.directus_files_id?.id, item.directus_files_id?.filename_download)"
        >
            {{ item.directus_files_id?.title || item.directus_files_id?.filename_download }}
        </span>

        <!-- Botones Acción -->
        <div class="flex items-center gap-4 border-l pl-4 ml-1">
            <!-- Download -->
            <button 
                @click.stop="handleDownload(item.directus_files_id?.id, item.directus_files_id?.filename_download)"
                class="text-slate-400 hover:text-blue-500 transition-colors p-0.5 rounded cursor-pointer"
                :disabled="!!downloadingId"
                title="Descargar"
            >
                <Loader2 v-if="downloadingId === item.directus_files_id?.id" class="h-3 w-3 animate-spin" />
                <Download v-else class="h-4 w-4" />
            </button>

            <!-- Delete -->
            <button 
                @click.stop="confirmDelete(item.directus_files_id?.id, item.id)"
                class="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                :disabled="!!deletingId"
                title="Eliminar"
            >
                <Loader2 v-if="deletingId === item.directus_files_id?.id" class="h-3 w-3 animate-spin text-red-500" />
                <Trash2 v-else class="h-4 w-4" />
            </button>
        </div>
        </div>
    </div>

    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro de que desea eliminar este archivo?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el archivo del servidor y no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="fileToDelete = null">Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" class="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600">
             Eliminar permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
