<script setup lang="ts">
import { FileText, Image, Download, Loader2, Trash2, Search } from 'lucide-vue-next'
import { useDirectusFiles } from '~/composables/useDirectusFiles'
import { ref, computed } from 'vue'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { ButtonGroup } from '~/components/ui/button-group'
import { toast } from 'vue-sonner'

const props = defineProps<{
  files: any[],
  collection: string
}>()

const emit = defineEmits(['deleted'])

const { removeFile, downloadFile } = useDirectusFiles()
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
    await downloadFile(fileId, filename)
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
      class="flex items-center justify-between gap-2 py-1.5 w-full"
      >
        <div class="flex items-center gap-2">
          <component :is="getFileIcon(item.directus_files_id?.type || item.type)" class="h-4 w-4 text-blue-500 shrink-0" />
          <span 
              class="truncate max-w-[200px] font-medium transition-colors cursor-pointer"
              :title="item.directus_files_id?.filename_download || item.filename_download"
              @click="handleDownload(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)"
          >
            {{ item.directus_files_id?.title || item.directus_files_id?.filename_download || item.title || item.filename_download }}
          </span>
        </div>  

        <ButtonGroup>
          <Button class="border-input" variant="outline" @click.stop="handleDownload(item.directus_files_id?.id || item.id, item.directus_files_id?.filename_download || item.filename_download)" :disabled="!!downloadingId">
            <Loader2 v-if="downloadingId === (item.directus_files_id?.id || item.id)" class="h-3 w-3 animate-spin" />
            <Download v-else class="h-4 w-4" />
          </Button>
          <Button class="border-input text-red-500" variant="outline" @click.stop="confirmDelete(item.directus_files_id?.id || item.id, item.id)" :disabled="!!deletingId">
            <Loader2 v-if="deletingId === (item.directus_files_id?.id || item.id)" class="h-3 w-3 animate-spin" />
            <Trash2 v-else class="h-4 w-4" />
          </Button>
        </ButtonGroup>

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
