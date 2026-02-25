<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import 'quill/dist/quill.snow.css'
import { Save } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  readOnly?: boolean
  loading?: boolean
  stickyTop?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
}>()

const editorRef = ref<HTMLElement | null>(null)
let quillInstance: any = null

onMounted(async () => {
  if (typeof window !== 'undefined' && editorRef.value) {
    const { default: Quill } = await import('quill')
    
    // Add custom save handler
    const toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ]

    quillInstance = new Quill(editorRef.value, {
      theme: 'snow',
      placeholder: props.placeholder,
      readOnly: props.readOnly,
      modules: {
        toolbar: {
          container: '#toolbar-container', // Use custom container
        }
      },
    })

    if (props.modelValue) {
      quillInstance.root.innerHTML = props.modelValue
    }

    quillInstance.on('text-change', () => {
      const html = quillInstance.root.innerHTML
      // Avoid emitting if the value is empty/only p tag
      const content = html === '<p><br></p>' ? '' : html
      emit('update:modelValue', content)
    })
  }
})

watch(() => props.modelValue, (newVal) => {
  if (quillInstance && newVal !== quillInstance.root.innerHTML) {
    quillInstance.root.innerHTML = newVal || ''
  }
})

watch(() => props.readOnly, (newVal) => {
  if (quillInstance) {
    quillInstance.enable(!newVal)
  }
})

onBeforeUnmount(() => {
  quillInstance = null
})
</script>

<template>
  <div class="quill-editor-wrapper bg-white rounded-md" :style="{ '--sticky-top': stickyTop || '0px' }">
    <!-- Custom Toolbar -->
    <div id="toolbar-container" class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center flex-wrap">
        <span class="ql-formats">
          <button class="ql-bold"></button>
          <button class="ql-italic"></button>
          <button class="ql-underline"></button>
          <button class="ql-strike"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-blockquote"></button>
          <button class="ql-code-block"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-header" value="1"></button>
          <button class="ql-header" value="2"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-list" value="ordered"></button>
          <button class="ql-list" value="bullet"></button>
        </span>
        <span class="ql-formats">
          <select class="ql-color"></select>
          <select class="ql-background"></select>
        </span>
        <span class="ql-formats">
          <button class="ql-link"></button>
          <button class="ql-image"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-clean"></button>
        </span>
      </div>
      
      <!-- Save Button -->
      <Button 
        @click="$emit('save')" 
        class="!w-fit !bg-slate-900 text-white !hover:text-white hover:bg-slate-800 flex items-center gap-2 !px-3 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        :disabled="loading || readOnly"
      >
        <Save class="w-4 h-4 text-white hover:text-white mr-2" />
        <span v-if="loading">Guardando...</span>
        <span v-else class="text-white hover:text-white">Guardar</span>
      </Button>
    </div>
    
    <div ref="editorRef" class="min-h-[200px]"></div>
  </div>
</template>

<style>
.quill-editor-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
}

.quill-editor-wrapper .ql-toolbar {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  border-color: #e2e8f0;
  position: sticky;
  top: var(--sticky-top);
  z-index: 50;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
}

.quill-editor-wrapper .ql-container {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  border-color: #e2e8f0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quill-editor-wrapper .ql-editor {
  flex: 1;
  min-height: 200px;
}
</style>