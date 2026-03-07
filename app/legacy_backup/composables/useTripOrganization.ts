import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import { format, parseISO } from 'date-fns'

// --- Interfaces ---

export interface EscalaVuelo {
  origen: string
  terminal_origen?: string
  destino: string
  terminal_destino?: string
  aerolinea: string
  numero_vuelo?: string
  fecha_salida: string
  fecha_llegada: string
  notas?: string
}

export interface Vuelo {
  id: number
  viaje_id: number
  titulo?: string
  escalas?: EscalaVuelo[]
  codigo_reserva?: string
  precio?: number
  moneda: 'EUR' | 'JPY'
  estado_pago?: 'pagado' | 'pendiente' | 'parcial'
  adjuntos?: any[]
  fecha_salida?: string
  fecha_llegada?: string
  origen?: string
  destino?: string
  aerolinea?: string
  numero_vuelo?: string
}

export interface Alojamiento {
  id: number
  viaje_id: number
  nombre: string
  direccion?: string
  check_in?: string // Backend field
  check_out?: string // Backend field
  fecha_entrada?: string // Frontend mapped field
  fecha_salida?: string // Frontend mapped field
  precio?: number
  moneda: 'EUR' | 'JPY'
  estado_pago: 'pagado' | 'pendiente' | 'parcial'
  notas?: string
  adjuntos?: any[]
  codigo_reserva?: string
  enlace_google?: string
  ciudad?: string
  prefectura?: string
  latitud?: number
  longitud?: number
  ubicacion?: {
    address?: string
    latitude: number
    longitude: number
    city?: string
    prefecture?: string
  }
  pension: string[] | null
  privado: boolean
  telefono: string
  email: string
  takkyubin: boolean
  user_created?: string | { first_name?: string, last_name?: string, email?: string, avatar_url?: string }
}

export interface Escala {
  origen: string
  destino: string
  medio: string
  fecha_salida: string
  fecha_llegada: string
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
  estado_pago?: 'pagado' | 'pendiente' | 'parcial'
  adjuntos?: any[]
  pase_id?: number | null
  pase_titulo?: string
  tipo_duracion?: 'dias' | 'horas'
  notas?: string
  origen?: string
  destino?: string
  medio?: string
  user_created?: string | { first_name?: string, last_name?: string, email?: string, avatar_url?: string }
}

export interface Actividad {
  id: number
  viaje_id: number
  nombre: string
  fecha?: string
  fecha_inicio?: string
  fecha_fin?: string
  tipo: 'museo' | 'parque' | 'evento' | 'otro'
  precio?: number
  moneda: 'EUR' | 'JPY'
  estado_pago: 'pagado' | 'pendiente' | 'parcial'
  notas?: string
  enlace_google?: string
  adjuntos?: any[]
  ubicacion?: {
    address?: string
    latitude: number
    longitude: number
    city?: string
    prefecture?: string
  }
  user_created?: string | { first_name?: string, last_name?: string, email?: string, avatar_url?: string }
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
  estado_pago?: 'pagado' | 'pendiente' | 'parcial'
  adjuntos?: any[]
  notas?: string
  user_created?: string | { first_name?: string, last_name?: string, email?: string, avatar_url?: string }
}

export interface TimelineItem {
  id: string
  type: 'flight' | 'accommodation' | 'transport' | 'activity' | 'expense'
  date: Date
  title: string
  subtitle: string
  originalItem: any
  metadata?: Record<string, any>
  user_created?: string | { first_name?: string, last_name?: string, email?: string, avatar_url?: string }
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

  // --- Timeline Computed ---
  const timelineItems = computed<TimelineItem[]>(() => {
    const items: TimelineItem[] = []

    // 1. Vuelos
    vuelos.value.forEach(v => {
      if (v.escalas && v.escalas.length > 0) {
        v.escalas.forEach((e: any, index) => {
          if (e.fecha_salida) {
            items.push({
              id: `flight-${v.id}-scale-${index}`,
              type: 'flight',
              date: new Date(e.fecha_salida),
              title: `Vuelo a ${e.destino}`,
              subtitle: `${e.aerolinea || 'Vuelo'} ${e.numero_vuelo ? '• ' + e.numero_vuelo : ''}`,
              originalItem: v,
              metadata: { scale: e }
            })
          }
        })
      } else if (v.fecha_salida) {
        items.push({
          id: `flight-${v.id}`,
          type: 'flight',
          date: new Date(v.fecha_salida),
          title: `Vuelo a ${v.destino}`,
          subtitle: `${v.aerolinea || 'Vuelo'} ${v.numero_vuelo ? '• ' + v.numero_vuelo : ''}`,
          originalItem: v
        })
      }
    })

    // 2. Alojamientos
    alojamientos.value.forEach(a => {
      if (a.check_in) {
        items.push({
          id: `accommodation-${a.id}`,
          type: 'accommodation',
          date: new Date(a.check_in),
          title: `Check-in: ${a.nombre}`,
          subtitle: a.direccion || a.ciudad || 'Sin dirección',
          originalItem: a
        })
      }
    })

    // 3. Transportes
    transportes.value.forEach(t => {
      if (t.escalas && t.escalas.length > 0) {
        t.escalas.forEach((e: any, index) => {
          if (e.fecha_salida) {
            items.push({
              id: `transport-${t.id}-scale-${index}`,
              type: 'transport',
              date: new Date(e.fecha_salida),
              title: `${e.medio}: ${e.origen} → ${e.destino}`,
              subtitle: e.notas || '',
              originalItem: t,
              metadata: { scale: e }
            })
          }
        })
      } else if (t.fecha_inicio) {
        items.push({
          id: `transport-${t.id}`,
          type: 'transport',
          date: new Date(t.fecha_inicio),
          title: t.nombre,
          subtitle: t.categoria === 'pase' ? 'Activación de Pase' : 'Transporte',
          originalItem: t
        })
      }
    })

    // 4. Actividades
    actividades.value.forEach(act => {
      // Priorizar fecha_inicio. NO USAR campo 'fecha' ya que es residual.
      const dateStr = act.fecha_inicio || act.start_date || act.datetime

      if (dateStr) {
        items.push({
          id: `activity-${act.id}`,
          type: 'activity',
          date: parseISO(dateStr),
          title: act.nombre,
          subtitle: act.tipo ? act.tipo.charAt(0).toUpperCase() + act.tipo.slice(1) : 'Actividad',
          originalItem: act
        })
      }
    })

    return items.sort((a, b) => a.date.getTime() - b.date.getTime())
  })

  // --- Utils ---
  const normalizeDate = (dateStr?: string) => {
    if (!dateStr) return dateStr
    // Si viene con Z (UTC) o milisegundos, lo limpiamos para dejarlo como YYYY-MM-DDTHH:mm
    // Esto fuerza a que la UI lo trate como "Hora Local" sin conversiones de zona horaria
    return (dateStr as string).replace('Z', '').split('.')[0]?.slice(0, 16) || ''
  }

  // --- Fetch All ---
  const fetchOrganizationData = async (tripId: string) => {
    loading.value = true
    
    const executeFetch = async (retry = true) => {
      try {
        const client = await getAuthenticatedClient()
        
        const query = (sortField: string) => ({
          filter: { viaje_id: { _eq: tripId } },
          sort: [sortField],
          fields: [
            '*',
            'adjuntos.directus_files_id.*'
            // 'user_created.first_name',
            // 'user_created.last_name',
            // 'user_created.avatar_url'
          ]
        })

        // 3. Executar peticiones
        const [v, a, t, act, s] = await Promise.all([
          client.request(readItems('vuelos' as any, query('fecha_salida'))),
          client.request(readItems('alojamientos' as any, {
            ...query('check_in'),
            fields: [
              '*',
              'adjuntos.directus_files_id.*'
            ]
          })),
          client.request(readItems('transportes' as any, {
            ...query('fecha_inicio'),
            fields: [
              ...query('fecha_inicio').fields,
              'pase_id.id',
              'pase_id.nombre'
            ]
          })),
          client.request(readItems('actividades' as any, {
             filter: { viaje_id: { _eq: tripId } },
             sort: ['fecha_inicio'],
             fields: [
               '*',
               'adjuntos.directus_files_id.*'
             ]
          })),
          client.request(readItems('seguros' as any, { 
              filter: { viaje_id: { _eq: tripId } }, 
              fields: [
                '*',
                'adjuntos.directus_files_id.*'
              ] 
          }))
        ])

        // Normalizamos las fechas para evitar problemas de zona horaria (UTC vs Local)
        vuelos.value = (v as unknown as Vuelo[]).map(i => ({
          ...i,
          // Los vuelos suelen ser JSON y ya vienen bien, pero por si acaso
          fecha_salida: normalizeDate(i.fecha_salida) || '',
          fecha_llegada: normalizeDate(i.fecha_llegada),
        }))

        // Mapear alojamientos
        alojamientos.value = (a as any[] || []).map((i: any) => ({
          id: i.id,
          viaje_id: i.viaje_id,
          nombre: i.nombre,
          fecha_entrada: normalizeDate(i.check_in),
          fecha_salida: normalizeDate(i.check_out),
          ubicacion: {
            address: i.direccion,
            latitude: parseFloat(i.latitud || '0'),
            longitude: parseFloat(i.longitud || '0'),
            city: i.ciudad,
            prefectura: i.prefectura
          },
          precio: parseFloat(i.precio),
          moneda: i.moneda,
          estado_pago: i.estado_pago,
          notas: i.notas,
          enlace_google: i.enlace_google,
          adjuntos: i.adjuntos || [],
          user_created: i.user_created || {},
          pension: i.pension || null,
          privado: i.privado || false,
          telefono: i.telefono || '',
          email: i.email || '', 
          takkyubin: i.takkyubin || false,
        }))

        transportes.value = (t as unknown as any[]).map(i => {
          // Auto-fill from segments if missing in root (for display purposes)
          let { origen, destino, medio } = i
          const escalas = i.escalas || []
          
          // Extract pass title if available
          const paseObj = i.pase_id
          const pase_titulo = paseObj?.nombre || ''
          const pase_id = typeof paseObj === 'object' ? paseObj?.id : paseObj
          
          if (i.categoria === 'trayecto' && escalas.length > 0) {
             if (!origen) origen = escalas[0].origen
             if (!destino) destino = escalas[escalas.length - 1].destino
             if (!medio) medio = escalas[0].medio
          }

          return {
            ...i,
            fecha_inicio: normalizeDate(i.fecha_inicio),
            fecha_fin: normalizeDate(i.fecha_fin),
            precio: parseFloat(i.precio?.toString() || '0'),
            escalas,
            origen,
            destino,
            medio,
            pase_id,
            pase_titulo,
            user_created: i.user_created || {}
          }
        })

        // Mapear actividades
        actividades.value = (act as any[] || []).map((a: any) => ({
          id: a.id,
          viaje_id: a.viaje_id,
          nombre: a.nombre,
          tipo: a.tipo,
          // Eliminado uso de campo 'fecha'
          fecha: undefined,
          fecha_inicio: normalizeDate(a.fecha_inicio),
          fecha_fin: normalizeDate(a.fecha_fin),
          ubicacion: {
            address: a.direccion,
            latitude: parseFloat(a.latitud || '0'),
            longitude: parseFloat(a.longitud || '0'),
            city: a.ciudad,
            prefecture: a.prefectura
          },
          precio: parseFloat(a.precio),
          moneda: a.moneda,
          estado_pago: a.estado_pago,
          notas: a.notas,
          enlace_google: a.enlace_google,
          adjuntos: a.adjuntos?.map((adj: any) => adj.directus_files_id) || [],
          user_created: a.user_created || {}
        }))

        seguros.value = (s as unknown as Seguro[]).map(i => ({
          ...i,
          fecha_inicio: normalizeDate(i.fecha_inicio),
          fecha_fin: normalizeDate(i.fecha_fin),
          user_created: i.user_created || {}
        }))
        
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
  const sanitizeResponse = (collection: string, item: any) => {
      const newItem = { ...item }
      if (collection === 'vuelos') {
         if (newItem.fecha_salida) newItem.fecha_salida = normalizeDate(newItem.fecha_salida)
         if (newItem.fecha_llegada) newItem.fecha_llegada = normalizeDate(newItem.fecha_llegada)
      }
      if (collection === 'alojamientos') {
         if (newItem.check_in) newItem.check_in = normalizeDate(newItem.check_in)
         if (newItem.check_out) newItem.check_out = normalizeDate(newItem.check_out)
      }
      if (collection === 'actividades') {
         // if (newItem.fecha) newItem.fecha = normalizeDate(newItem.fecha)
         if (newItem.fecha_inicio) newItem.fecha_inicio = normalizeDate(newItem.fecha_inicio)
         if (newItem.fecha_fin) newItem.fecha_fin = normalizeDate(newItem.fecha_fin)
      }
      if (collection === 'transportes') {
         if (newItem.fecha_inicio) newItem.fecha_inicio = normalizeDate(newItem.fecha_inicio)
         if (newItem.fecha_fin) newItem.fecha_fin = normalizeDate(newItem.fecha_fin)
         
         // Ensure price is a number
         if (newItem.precio) newItem.precio = parseFloat(newItem.precio.toString())
         
         const escalas = newItem.escalas || []
         newItem.escalas = escalas

         if (newItem.categoria === 'trayecto' && escalas.length > 0) {
             if (!newItem.origen) newItem.origen = escalas[0].origen
             if (!newItem.destino) newItem.destino = escalas[escalas.length - 1].destino
             if (!newItem.medio) newItem.medio = escalas[0].medio
         }
      }
      if (collection === 'seguros') {
         if (newItem.fecha_inicio) newItem.fecha_inicio = normalizeDate(newItem.fecha_inicio)
         if (newItem.fecha_fin) newItem.fecha_fin = normalizeDate(newItem.fecha_fin)
      }
      return newItem
  }

  const createItemGeneric = async (collection: string, item: any, state: any) => {
    try {
      const client = await getAuthenticatedClient()
      let res = await client.request(createItem(collection as any, item)) as any
      // Add empty attachments array for UI consistency
      res.adjuntos = []
      // Sanitize dates
      res = sanitizeResponse(collection, res)
      
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
      let res = await client.request(updateItem(collection as any, id, item)) as any
      // Maintain attachments from state if not returned updated
      const existing = state.value.find((i: any) => i.id === id)
      if (existing && existing.adjuntos) res.adjuntos = existing.adjuntos
      
      // Sanitize dates
      res = sanitizeResponse(collection, res)

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
      await client.request(deleteItem(collection as any, id))
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

  const createAlojamiento = async (data: any) => {
    const payload = {
      viaje_id: data.viaje_id,
      nombre: data.nombre,
      check_in: data.fecha_entrada,
      check_out: data.fecha_salida,
      direccion: data.ubicacion?.address,
      latitud: data.ubicacion?.latitude,
      longitud: data.ubicacion?.longitude,
      ciudad: data.ubicacion?.city,
      prefectura: data.ubicacion?.prefecture,
      precio: data.precio,
      moneda: data.moneda,
      estado_pago: data.estado_pago,
      notas: data.notas,
      enlace_google: data.enlace_google,
      adjuntos: data.adjuntos || [],
      //user_created: data.user_created || {},
      pension: data.pension || null,
      privado: data.privado || false,
      telefono: data.telefono || '',
      email: data.email || '', 
      takkyubin: data.takkyubin || false,
    }
    return createItemGeneric('alojamientos', payload, alojamientos)
  }
  const updateAlojamiento = async (id: number, data: any) => {
    const payload = {
      nombre: data.nombre,
      check_in: data.fecha_entrada,
      check_out: data.fecha_salida,
      direccion: data.ubicacion?.address,
      latitud: data.ubicacion?.latitude,
      longitud: data.ubicacion?.longitude,
      ciudad: data.ubicacion?.city,
      prefectura: data.ubicacion?.prefecture,
      precio: data.precio,
      moneda: data.moneda,
      estado_pago: data.estado_pago,
      notas: data.notas,
      enlace_google: data.enlace_google,
      //adjuntos: data.adjuntos || [],
      //user_created: data.user_created || {},
      pension: data.pension || null,
      privado: data.privado || false,
      telefono: data.telefono || '',
      email: data.email || '', 
      takkyubin: data.takkyubin || false,
    }
    return updateItemGeneric('alojamientos', id, payload, alojamientos)
  }
  const deleteAlojamiento = (id: number) => deleteItemGeneric('alojamientos', id, alojamientos)

  const createTransporte = (item: Omit<Transporte, 'id'>) => {
    const payload = { ...item }
    // @ts-ignore
    delete payload.pase_nombre
    // @ts-ignore
    delete payload.pase_titulo
    return createItemGeneric('transportes', payload, transportes)
  }
  const updateTransporte = (id: number, item: Partial<Transporte>) => {
    const payload = { ...item }
    // @ts-ignore
    delete payload.pase_nombre
    // @ts-ignore
    delete payload.pase_titulo
    return updateItemGeneric('transportes', id, payload, transportes)
  }
  const deleteTransporte = (id: number) => deleteItemGeneric('transportes', id, transportes)

  const createActividad = async (data: any) => {
    const payload = {
      viaje_id: data.viaje_id,
      nombre: data.nombre,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      tipo: data.tipo,
      direccion: data.ubicacion?.address,
      latitud: data.ubicacion?.latitude,
      longitud: data.ubicacion?.longitude,
      ciudad: data.ubicacion?.city,
      prefectura: data.ubicacion?.prefecture,
      precio: data.precio,
       moneda: data.moneda,
       estado_pago: data.estado_pago,
       notas: data.notas,
       enlace_google: data.enlace_google
     }
     return createItemGeneric('actividades', payload, actividades)
   }
   const updateActividad = async (id: number, data: any) => {
     const payload = {
       nombre: data.nombre,
       fecha_inicio: data.fecha_inicio,
       fecha_fin: data.fecha_fin,
       tipo: data.tipo,
       direccion: data.ubicacion?.address,
      latitud: data.ubicacion?.latitude,
      longitud: data.ubicacion?.longitude,
      ciudad: data.ubicacion?.city,
       prefectura: data.ubicacion?.prefecture,
       precio: data.precio,
       moneda: data.moneda,
       estado_pago: data.estado_pago,
       notas: data.notas,
       enlace_google: data.enlace_google
     }
     return updateItemGeneric('actividades', id, payload, actividades)
   }
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
    timelineItems,
    loading,
    fetchOrganizationData,
    createVuelo, updateVuelo, deleteVuelo,
    createAlojamiento, updateAlojamiento, deleteAlojamiento,
    createTransporte, updateTransporte, deleteTransporte,
    createActividad, updateActividad, deleteActividad,
    createSeguro, updateSeguro, deleteSeguro
  }
}
