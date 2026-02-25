import { createDirectus, rest, staticToken } from '@directus/sdk'

import type { TripExpense } from '~/types'

interface Trip {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  status: string
  user_created: string
}

interface DirectusUser {
  id: string
  first_name: string
  last_name: string
  email: string
  moneda: string | null
}

interface Schema {
  viajes: Trip[]
  directus_users: DirectusUser[]
  gastos: TripExpense[]
}

let syncPromise: Promise<void> | null = null

export const useDirectus = () => {
  const { user, isLoaded } = useUser() // Clerk user
  const directusUrl = 'https://directus.jizou.io'
  
  // State to cache the Directus token and User ID
  const directusToken = useState<string | null>('directus-token', () => null)
  const directusUserId = useState<string | null>('directus-user-id', () => null)

  // Cliente base sin autenticación
  const client = createDirectus<Schema>(directusUrl).with(rest())

  const getAuthenticatedClient = async () => {
    // Si ya tenemos token, devolvemos cliente autenticado
    if (directusToken.value) {
      return createDirectus<Schema>(directusUrl)
        .with(staticToken(directusToken.value))
        .with(rest())
    }

    // En SSR, no podemos esperar a Clerk (client-side only)
    if (import.meta.server) {
      return client
    }

    // En cliente, esperar a que Clerk cargue completamente
    if (!isLoaded.value) {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (isLoaded.value) resolve()
          else setTimeout(check, 100)
        }
        check()
      })
    }

    // Si no hay usuario de Clerk, devolvemos cliente público
    if (!user.value) {
      console.log('[Directus] No user logged in, returning public client')
      return client
    }

    if (!syncPromise) {
      syncPromise = (async () => {
        try {
          // Sincronizar usuario y obtener token
          const response = await $fetch('/api/auth/sync-user', {
            method: 'POST',
            body: {
              email: user.value?.primaryEmailAddress?.emailAddress,
              firstName: user.value?.firstName,
              lastName: user.value?.lastName,
              imageUrl: user.value?.imageUrl
            }
          })
          
          const { token, userId, error, details } = response as any
          
          if (error) {
            console.error('[Directus] Sync error:', error, details)
            throw new Error(`Authentication failed: ${error} - ${details || ''}`)
          }

          if (token) {
            directusToken.value = token
            if (userId) directusUserId.value = userId
          }
        } catch (e) {
          console.error('[Directus] Error syncing user:', e)
          directusToken.value = null // Limpiar token inválido
          throw e
        } finally {
          syncPromise = null
        }
      })()
    }

    try {
      await syncPromise

      if (directusToken.value) {
        return createDirectus<Schema>(directusUrl)
          .with(staticToken(directusToken.value))
          .with(rest())
      }
    } catch (e) {
      throw e
    }

    return client
  }

  const resetToken = () => {
    directusToken.value = null
    directusUserId.value = null
  }

  return {
    client,
    getAuthenticatedClient,
    directusUserId,
    token: directusToken,
    resetToken,
    url: directusUrl
  }
}
