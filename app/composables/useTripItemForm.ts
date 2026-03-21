import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'

export function useTripItemForm<T extends { id?: number, moneda: string, precio?: number, adjuntos?: any[] }>(
  defaultValues: () => T,
  createAction: (item: any) => Promise<any>,
  updateAction: (id: number, item: any) => Promise<any>,
  itemLabel: string = 'Elemento'
) {
  const activeModal = ref(false)
  const formData = ref<T>(defaultValues())

  // Watch for JPY currency to round price
  watch(() => [formData.value.moneda, formData.value.currency], ([newMoneda, newCurrency]) => {
    const currency = newCurrency || newMoneda
    const price = formData.value.price || formData.value.precio

    if (currency === 'JPY' && price) {
      if (formData.value.price) formData.value.price = Math.round(formData.value.price)
      if (formData.value.precio) formData.value.precio = Math.round(formData.value.precio)
    }
  })

  // Watch modal state to reset form logic
  watch(activeModal, (val) => {
    if (val && !formData.value.id) { 
       // Optional: verify cleanliness or re-reset
    } else if (!val) {
      // Modal closed - reset form for next time
      resetForm()
    }
  })

  const resetForm = () => {
    formData.value = defaultValues()
  }

  const handleCreate = () => {
    resetForm()
    activeModal.value = true
  }

  const handleEdit = (item: T) => {
    // Deep copy to avoid mutating original list item
    formData.value = JSON.parse(JSON.stringify(item))
    
    // Ensure integer for JPY (in case data came from DB with decimals)
    const currency = formData.value.currency || formData.value.moneda
    if (currency === 'JPY') {
      if (formData.value.price) formData.value.price = Math.round(formData.value.price)
      if (formData.value.precio) formData.value.precio = Math.round(formData.value.precio)
    }
    
    activeModal.value = true
  }

  const handleSave = async (
    payloadProcessor?: (data: T) => any,
    onSuccess?: (result: any) => void,
    opts?: { resetOnSuccess?: boolean }
  ) => {
    try {
      // Prepare payload: allow custom processing or use default copy
      let payload = payloadProcessor ? payloadProcessor(formData.value) : { ...formData.value }
      
      // Generic cleanup of readonly/UI fields
      // @ts-ignore
      delete payload.adjuntos
      // @ts-ignore
      delete payload.id
      // @ts-ignore
      delete payload.user_created
      // @ts-ignore
      delete payload.user_updated
      // @ts-ignore
      delete payload.date_created
      // @ts-ignore
      delete payload.date_updated

      let result: any = null

      if (formData.value.id) {
         result = await updateAction(formData.value.id, payload)
         toast.success(`${itemLabel} actualizado`)
      } else {
         result = await createAction(payload)
         toast.success(`${itemLabel} creado`)
      }
      
      activeModal.value = false
      if (opts?.resetOnSuccess !== false) resetForm()

      if (onSuccess) onSuccess(result)
      return result
    } catch (e: any) {
      console.error(`Error saving ${itemLabel}:`, e)
      
      let errorMessage = 'Error al guardar'
      
      if (e.message?.includes('permission') || e.message?.includes('access')) {
        errorMessage = 'Error de permisos: Algunos campos no existen o no tienes acceso'
        const fieldMatch = e.message.match(/fields?\s+["']([^"']+)["']/)
        if (fieldMatch) {
          errorMessage += `. Campos problemáticos: ${fieldMatch[1]}`
        }
      } else if (e.message?.includes('validation')) {
        errorMessage = 'Error de validación: Verifica los datos ingresados'
      }
      
      toast.error(errorMessage)
      return null
    }
  }

  return {
    activeModal,
    formData,
    resetForm,
    handleCreate,
    handleEdit,
    handleSave
  }
}
