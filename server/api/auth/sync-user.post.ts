import { createDirectus, rest, readUsers, createUser, updateUser, staticToken } from '@directus/sdk'

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

    const directusUrl = 'https://api.mevoyajapon.com'
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
        const newToken = generateSimpleToken()
        directusUser = await adminClient.request(createUser({
          email: userEmail,
          first_name: body.firstName || 'Viajero',
          last_name: body.lastName || '',
          role: 'a78c3ab5-20eb-451f-b93f-c087f500fb47', // App User Role
          status: 'active',
          provider: 'default',
          token: newToken
        }))
        tokenToReturn = newToken
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
