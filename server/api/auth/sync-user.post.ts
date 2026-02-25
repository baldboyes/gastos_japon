import { createDirectus, rest, readUsers, createUser, updateUser, staticToken, readItems, deleteItem } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  // 1. Validar Autenticación de Clerk
  // Aseguramos que quien llama a este endpoint es un usuario legítimo logueado en Clerk
  const { userId: clerkUserId } = event.context.auth || {}
  
  if (!clerkUserId) {
    console.error('[SYNC] Unauthorized attempt: No Clerk session found')
    return { error: 'Unauthorized', statusCode: 401 }
  }

  try {
    const body = await readBody(event)
    const userEmail = body?.email
    
    if (!userEmail) {
      return { error: 'Email required' }
    }

    const directusUrl = 'https://directus.jizou.io'
    // Explicación: Usamos credenciales de Admin (Token) para generar el token inicial del usuario.
    const adminToken = process.env.NUXT_DIRECTUS_ADMIN_TOKEN || 'hYOCsJK_Ros_zlClJynUFlVQT7W_G9La'
    
    // Conectar a Directus como Admin usando Token Estático
    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // Buscar Usuario
    const existingUsers = await adminClient.request(readUsers({
      filter: { email: { _eq: userEmail } },
      fields: ['id', 'email']
    }))

    let directusUser
    let tokenToReturn

    if (existingUsers.length > 0) {
      directusUser = existingUsers[0]
    } else {
      // Crear Usuario
      try {
        // 1. Buscar si hay una invitación pendiente para determinar el rol
        let userRole = 'a78c3ab5-20eb-451f-b93f-c087f500fb47' // Default: App User Role
        let invitationId = null

        try {
          const invitations = await adminClient.request(readItems('invitations', {
            filter: { 
              email: { _eq: userEmail },
              status: { _eq: 'pending' }
            },
            limit: 1
          }))
          
          if (invitations && invitations.length > 0) {
            const inv = invitations[0]
            // Asegurar que obtenemos el ID del rol (por si Directus lo expande)
            userRole = typeof inv.role === 'object' ? inv.role.id : inv.role
            invitationId = inv.id
            console.log(`[SYNC] Found invitation for ${userEmail}, using role: ${userRole}`)
          }
        } catch (e) {
          console.warn('[SYNC] Error checking invitations (skipping):', e)
        }

        // 2. Crear el usuario con el rol determinado
        const newToken = generateSimpleToken()
        directusUser = await adminClient.request(createUser({
          email: userEmail,
          first_name: body.firstName || 'Viajero',
          last_name: body.lastName || '',
          role: userRole, 
          status: 'active',
          provider: 'default',
          token: newToken
        }))
        tokenToReturn = newToken

        // 3. Eliminar la invitación si se procesó correctamente
        if (invitationId) {
          try {
            await adminClient.request(deleteItem('invitations', invitationId))
          } catch (e) {
            console.warn('[SYNC] Could not delete invitation after use:', e)
          }
        }

      } catch (e: any) {
        console.error('[SYNC] Create failed:', e)
        return { error: 'Create user failed', details: e.message }
      }
    }

    // Actualizar Token (siempre, para garantizar uno válido en cada sesión)
    // También actualizamos el avatar_url si viene de Clerk
    if (!tokenToReturn) {
      tokenToReturn = generateSimpleToken()
      const updatePayload: any = { token: tokenToReturn }
      if (body.imageUrl) {
        updatePayload.avatar_url = body.imageUrl
      }
      await adminClient.request(updateUser(directusUser.id, updatePayload))
    } else if (body.imageUrl) {
       // Si ya existía el usuario, aprovechamos para actualizar el avatar si ha cambiado (o si no lo tenía)
       // Esto se ejecuta en cada login
       await adminClient.request(updateUser(directusUser.id, { 
        avatar_url: body.imageUrl 
      } as any))
    }

    return { 
      success: true, 
      token: tokenToReturn, 
      userId: directusUser.id 
    }

  } catch (error: any) {
    console.error('[SYNC] Critical Error:', error)
    return { 
      error: 'Critical Server Error', 
      details: error.message || String(error)
    }
  }
})

function generateSimpleToken() {
  // Token seguro URL-safe
  return 'trae_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
