import { ref } from 'vue'
import { format } from 'date-fns'
import { toast } from 'vue-sonner'

export const useDayNotesNew = () => {
  const note = ref('')
  const noteId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)

  const dateToKey = (date: Date) => format(date, 'yyyy-MM-dd')

  const fetchFromCollection = async (tripId: number | string, dateKey: string) => {
    return await $fetch('/api/trips/daily-notes', {
      method: 'GET',
      query: { tripId: Number(tripId), date: dateKey }
    }) as any
  }

  const saveToCollection = async (tripId: number | string, dateKey: string, content: string) => {
    return await $fetch('/api/trips/daily-notes', {
      method: 'PUT',
      body: { tripId: Number(tripId), date: dateKey, content }
    }) as any
  }
  
  const fetchNote = async (tripId: number | string, date: Date) => {
    loading.value = true
    const dateKey = dateToKey(date)
    
    try {
      const result = await fetchFromCollection(tripId, dateKey)
      note.value = result.content
      noteId.value = result.id
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
      const res = await saveToCollection(tripId, dateKey, content)
      noteId.value = res?.id ?? null

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
