import { ref } from 'vue'
import { useDirectus } from '~/composables/useDirectus'
import { readItems, createItem, updateItem } from '@directus/sdk'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'

export const useDayNotes = () => {
  const { getAuthenticatedClient } = useDirectus()
  const note = ref('')
  const noteId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  
  const fetchNote = async (tripId: number | string, date: Date) => {
    loading.value = true
    const dateStr = format(date, 'yyyy-MM-dd')
    
    try {
      const client = await getAuthenticatedClient()
      const items = await client.request(readItems('notas_diarias' as any, {
        filter: {
          viaje_id: { _eq: tripId },
          fecha: { _eq: dateStr }
        },
        limit: 1
      })) as any[]

      if (items && items.length > 0 && items[0]) {
        note.value = items[0].contenido || ''
        noteId.value = items[0].id
      } else {
        note.value = ''
        noteId.value = null
      }
    } catch (e: any) {
      // Only show error if it's not a 403 (collection might not exist yet or no access)
      if (e?.errors?.[0]?.extensions?.code !== 'FORBIDDEN') {
         // silent fail
      }
    } finally {
      loading.value = false
    }
  }

  const saveNote = async (tripId: number | string, date: Date, content: string) => {
    if (!content && !noteId.value) {
        return 
    }
    
    saving.value = true
    const dateStr = format(date, 'yyyy-MM-dd')
    
    try {
      const client = await getAuthenticatedClient()
      if (noteId.value) {
        await client.request(updateItem('notas_diarias' as any, noteId.value, {
          contenido: content
        }))
        toast.success('Nota actualizada correctamente')
      } else {
        const newItem = await client.request(createItem('notas_diarias' as any, {
          viaje_id: tripId,
          fecha: dateStr,
          contenido: content
        })) as any
        noteId.value = newItem.id
        toast.success('Nota creada correctamente')
      }
      note.value = content
    } catch (e: any) {
      toast.error('Error al guardar la nota: ' + (e.message || 'Error desconocido'))
    } finally {
      saving.value = false
    }
  }

  return {
    note,
    loading,
    saving,
    fetchNote,
    saveNote
  }
}
