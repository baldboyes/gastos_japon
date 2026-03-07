import { ref } from 'vue'
import { useDirectusRepo } from '~/composables/useDirectusRepo'
import { readItems, createItem, updateItem } from '@directus/sdk'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'

export const useDayNotesNew = () => {
  const { getClient } = useDirectusRepo()
  const note = ref('')
  const noteId = ref<number | null>(null)
  const noteCollection = useState<'daily_notes' | 'notas_diarias'>('day-notes-collection', () => 'daily_notes')
  const loading = ref(false)
  const saving = ref(false)

  const dateToKey = (date: Date) => format(date, 'yyyy-MM-dd')

  const fetchFromCollection = async (collection: 'daily_notes' | 'notas_diarias', tripId: number | string, dateKey: string) => {
    const client = await getClient()
    const filter = collection === 'daily_notes'
      ? { trip_id: { _eq: Number(tripId) }, date: { _eq: dateKey } }
      : { viaje_id: { _eq: Number(tripId) }, fecha: { _eq: dateKey } }

    const fields = collection === 'daily_notes'
      ? ['id', 'content'] as const
      : ['id', 'contenido'] as const

    const items = await client.request(readItems(collection as any, {
      filter,
      fields: fields as any,
      limit: 1
    })) as any[]

    if (items && items.length > 0) {
      return {
        id: Number(items[0].id),
        content: String(collection === 'daily_notes' ? (items[0].content || '') : (items[0].contenido || ''))
      }
    }

    return { id: null as number | null, content: '' }
  }

  const saveToCollection = async (collection: 'daily_notes' | 'notas_diarias', tripId: number | string, dateKey: string, content: string) => {
    const client = await getClient()

    if (noteId.value) {
      const data = collection === 'daily_notes' ? { content } : { contenido: content }
      await client.request(updateItem(collection as any, noteId.value, data as any))
      return { id: noteId.value }
    }

    const data = collection === 'daily_notes'
      ? { trip_id: Number(tripId), date: dateKey, content }
      : { viaje_id: Number(tripId), fecha: dateKey, contenido: content }

    const newItem = await client.request(createItem(collection as any, data as any)) as any
    return { id: Number(newItem.id) }
  }
  
  const fetchNote = async (tripId: number | string, date: Date) => {
    loading.value = true
    const dateKey = dateToKey(date)
    
    try {
      try {
        const result = await fetchFromCollection(noteCollection.value, tripId, dateKey)
        note.value = result.content
        noteId.value = result.id
      } catch (e1: any) {
        const fallback = noteCollection.value === 'daily_notes' ? 'notas_diarias' : 'daily_notes'
        const result = await fetchFromCollection(fallback, tripId, dateKey)
        noteCollection.value = fallback
        note.value = result.content
        noteId.value = result.id
      }
    } catch (e: any) {
       console.error('Error fetching daily note:', e)
    } finally {
      loading.value = false
    }
  }

  const saveNote = async (tripId: number | string, date: Date, content: string) => {
    if (!content && !noteId.value) return
    
    saving.value = true
    const dateKey = dateToKey(date)
    const wasExisting = !!noteId.value
    
    try {
      try {
        const res = await saveToCollection(noteCollection.value, tripId, dateKey, content)
        noteId.value = res.id
      } catch (e1: any) {
        const fallback = noteCollection.value === 'daily_notes' ? 'notas_diarias' : 'daily_notes'
        const res = await saveToCollection(fallback, tripId, dateKey, content)
        noteCollection.value = fallback
        noteId.value = res.id
      }

      toast.success(wasExisting ? 'Nota actualizada' : 'Nota guardada')
      note.value = content
    } catch (e: any) {
      console.error('Error saving note:', e)
      toast.error('Error al guardar la nota')
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
