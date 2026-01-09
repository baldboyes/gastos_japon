import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'

// --- Interfaces ---

export interface EscalaVuelo {
  origen: string
  destino: string
  aerolinea: string
  numero_vuelo?: string
  terminal?: string
  fecha_salida: string
  fecha_llegada: string
}

export interface Vuelo {
  id: number
  viaje_id: number
  titulo?: string
  origen: string
  destino: string
  fecha_salida: string
  fecha_llegada?: string
  aerolinea?: string
  numero_vuelo?: string
  terminal?: string
  escalas?: EscalaVuelo[]
  codigo_reserva?: string
  precio?: number
  moneda: 'EUR' | 'JPY'
  adjuntos?: any[]
}

export interface Alojamiento {
  id: number
  viaje_id: number
  nombre: string
  direccion?: string
  check_in: string
  check_out: string
  precio?: number
  moneda: 'EUR' | 'JPY'
  estado_pago: 'pagado' | 'pendiente' | 'parcial'
  adjuntos?: any[]
  codigo_reserva?: string
  enlace_google?: string
  ciudad?: string
  prefectura?: string
  latitud?: number
  longitud?: number
  user_created?: string | { first_name?: string, last_name?: string, email?: string, avatar_url?: string }
}

export interface Escala {
  origen: string
  destino: string
  medio: string
  fecha_salida: string
  fecha_llegada: string
  notas?: string
}

export interface Transporte {
  id: number
  viaje_id: number
  nombre: string
  categoria: 'pase' | 'trayecto'
  fecha_inicio?: string
  fecha_fin?: string
  escalas?: Escala[]
  precio?: number
  moneda: 'EUR' | 'JPY'
  adjuntos?: any[]
  pase_id?: number | null
}

export interface Actividad {
  id: number
  viaje_id: number
  nombre: string
  fecha?: string
  tipo: 'museo' | 'parque' | 'evento' | 'otro'
  precio?: number
  moneda: 'EUR' | 'JPY'
  estado_pago: 'pagado' | 'pendiente'
  adjuntos?: any[]
}

export interface Seguro {
  id: number
  viaje_id: number
  compania: string
  tipo: 'salud' | 'cancelacion' | 'completo'
  numero_poliza?: string
  telefono_urgencias?: string
  email_urgencias?: string
  fecha_inicio?: string
  fecha_fin?: string
  precio?: number
  moneda: 'EUR' | 'JPY'
  adjuntos?: any[]
}

export const useTripOrganization = () => {
  const { getAuthenticatedClient } = useDirectus()
  
  // State
  const vuelos = useState<Vuelo[]>('org-vuelos', () => [])
  const alojamientos = useState<Alojamiento[]>('org-alojamientos', () => [])
  const transportes = useState<Transporte[]>('org-transportes', () => [])
  const actividades = useState<Actividad[]>('org-actividades', () => [])
  const seguros = useState<Seguro[]>('org-seguros', () => [])
  
  const loading = useState<boolean>('org-loading', () => false)

  // --- Fetch All ---
  const fetchOrganizationData = async (tripId: string) => {
    loading.value = true
    
    const executeFetch = async (retry = true) => {
      try {
        const client = await getAuthenticatedClient()
        
        const query = (sortField: string) => ({
          filter: { viaje_id: { _eq: tripId } },
          sort: [sortField],
          fields: ['*', 'adjuntos.directus_files_id.*']
        })

        const [v, a, t, act, s] = await Promise.all([
          client.request(readItems('vuelos' as any, query('fecha_salida'))),
          client.request(readItems('alojamientos' as any, {
            ...query('check_in'),
            fields: ['*', 'adjuntos.directus_files_id.*', 'user_created.first_name', 'user_created.last_name', 'user_created.avatar_url']
          })),
          client.request(readItems('transportes' as any, query('fecha_inicio'))),
          client.request(readItems('actividades' as any, query('fecha'))),
          client.request(readItems('seguros' as any, { 
              filter: { viaje_id: { _eq: tripId } }, 
              fields: ['*', 'adjuntos.directus_files_id.*'] 
          }))
        ])

        vuelos.value = v as unknown as Vuelo[]
        alojamientos.value = a as unknown as Alojamiento[]
        transportes.value = t as unknown as Transporte[]
        actividades.value = act as unknown as Actividad[]
        seguros.value = s as unknown as Seguro[]
        
      } catch (e: any) {
        // Detectar token inválido y reintentar
        const isAuthError = e.message?.includes('Invalid user credentials') || 
                           (e.errors && e.errors[0]?.message?.includes('Invalid user credentials')) ||
                           e.response?.status === 401

        if (isAuthError && retry) {
            console.warn('[TripOrg] Token inválido. Reintentando...')
            const { resetToken } = useDirectus()
            resetToken()
            // Pequeña pausa
            await new Promise(r => setTimeout(r, 200))
            return executeFetch(false)
        }
        throw e
      }
    }

    try {
      await executeFetch()
    } catch (e) {
      console.error('Error fetching organization data:', e)
    } finally {
      loading.value = false
    }
  }

  // --- Generic CRUD Helper ---
  const createItemGeneric = async (collection: string, item: any, state: any) => {
    try {
      const client = await getAuthenticatedClient()
      const res = await client.request(createItem(collection, item))
      // Add empty attachments array for UI consistency
      res.adjuntos = []
      state.value.push(res)
      return res
    } catch (e) {
      console.error(`Error creating ${collection}:`, e)
      throw e
    }
  }

  const updateItemGeneric = async (collection: string, id: number, item: any, state: any) => {
    try {
      const client = await getAuthenticatedClient()
      const res = await client.request(updateItem(collection, id, item))
      // Maintain attachments from state if not returned updated
      const existing = state.value.find((i: any) => i.id === id)
      if (existing && existing.adjuntos) res.adjuntos = existing.adjuntos
      
      const index = state.value.findIndex((i: any) => i.id === id)
      if (index !== -1) state.value[index] = res
      return res
    } catch (e: any) {
      console.error(`Error updating ${collection}:`, e)
      
      // Proporcionar información más detallada sobre el error
      if (e.message?.includes('permission') || e.message?.includes('access')) {
        console.error('Error de permisos detectado. Campos problemáticos:', e.message)
        // Extraer información sobre campos específicos del mensaje de error
        const fieldMatch = e.message.match(/fields?\s+["']([^"']+)["']/)
        if (fieldMatch) {
          console.error(`Los siguientes campos pueden tener problemas de permisos o no existir: ${fieldMatch[1]}`)
        }
      }
      
      throw e
    }
  }

  const deleteItemGeneric = async (collection: string, id: number, state: any) => {
    try {
      const client = await getAuthenticatedClient()
      await client.request(deleteItem(collection, id))
      state.value = state.value.filter((i: any) => i.id !== id)
    } catch (e) {
      console.error(`Error deleting ${collection}:`, e)
      throw e
    }
  }

  // --- Specific Actions ---
  const createVuelo = (item: Omit<Vuelo, 'id'>) => createItemGeneric('vuelos', item, vuelos)
  const updateVuelo = (id: number, item: Partial<Vuelo>) => updateItemGeneric('vuelos', id, item, vuelos)
  const deleteVuelo = (id: number) => deleteItemGeneric('vuelos', id, vuelos)

  const createAlojamiento = (item: Omit<Alojamiento, 'id'>) => createItemGeneric('alojamientos', item, alojamientos)
  const updateAlojamiento = (id: number, item: Partial<Alojamiento>) => updateItemGeneric('alojamientos', id, item, alojamientos)
  const deleteAlojamiento = (id: number) => deleteItemGeneric('alojamientos', id, alojamientos)

  const createTransporte = (item: Omit<Transporte, 'id'>) => createItemGeneric('transportes', item, transportes)
  const updateTransporte = (id: number, item: Partial<Transporte>) => updateItemGeneric('transportes', id, item, transportes)
  const deleteTransporte = (id: number) => deleteItemGeneric('transportes', id, transportes)

  const createActividad = (item: Omit<Actividad, 'id'>) => createItemGeneric('actividades', item, actividades)
  const updateActividad = (id: number, item: Partial<Actividad>) => updateItemGeneric('actividades', id, item, actividades)
  const deleteActividad = (id: number) => deleteItemGeneric('actividades', id, actividades)

  const createSeguro = (item: Omit<Seguro, 'id'>) => createItemGeneric('seguros', item, seguros)
  const updateSeguro = (id: number, item: Partial<Seguro>) => updateItemGeneric('seguros', id, item, seguros)
  const deleteSeguro = (id: number) => deleteItemGeneric('seguros', id, seguros)

  return {
    vuelos,
    alojamientos,
    transportes,
    actividades,
    seguros,
    loading,
    fetchOrganizationData,
    createVuelo, updateVuelo, deleteVuelo,
    createAlojamiento, updateAlojamiento, deleteAlojamiento,
    createTransporte, updateTransporte, deleteTransporte,
    createActividad, updateActividad, deleteActividad,
    createSeguro, updateSeguro, deleteSeguro
  }
}
