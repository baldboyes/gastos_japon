<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Loader2 } from 'lucide-vue-next'
import { useDirectusFiles } from '~/composables/useDirectusFiles'
import { toast } from 'vue-sonner'

const props = defineProps<{
  collection: string
  itemId: number
}>()

const emit = defineEmits(['uploaded'])
const uploading = ref(false)
const fileInput = ref<HTMLInputElement>()

const { uploadFile, attachFileToItem } = useDirectusFiles()

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const handleFileSelect = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  
  // Validar tamaño antes de subir
  for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_SIZE_BYTES) {
          toast.error(`El archivo "${files[i].name}" supera el límite de ${MAX_SIZE_MB}MB`)
          if (fileInput.value) fileInput.value.value = ''
          return
      }
  }
  
  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const fileId = await uploadFile(files[i])
      await attachFileToItem(props.collection, props.itemId, fileId)
    }
    toast.success('Archivos subidos correctamente')
    emit('uploaded')
  } catch (e) {
    console.error(e)
    toast.error('Error al subir archivos')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div>
    <input 
      type="file" 
      ref="fileInput" 
      class="hidden" 
      multiple 
      accept=".pdf,.jpg,.jpeg,.png"
      @change="handleFileSelect"
    />
    <Button variant="outline" size="sm" @click="fileInput?.click()" :disabled="uploading">
      <Loader2 v-if="uploading" class="h-4 w-4 animate-spin mr-2" />
      <Upload v-else class="h-4 w-4 mr-2" />
      Adjuntar
    </Button>
  </div>
</template>
