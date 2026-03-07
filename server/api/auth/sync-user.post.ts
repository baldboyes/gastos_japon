import { createDirectus, rest, readUsers, createUser, updateUser, staticToken, readItems, deleteItem, createItem } from '@directus/sdk'

const extractEmailsFromClaims = (claims: any): string[] => {
  const out = new Set<string>()
  const push = (v: any) => {
    if (typeof v === 'string' && v.includes('@')) out.add(v.trim().toLowerCase())
  }

  if (!claims || typeof claims !== 'object') return []

  push((claims as any).email)
  push((claims as any).primary_email)
  push((claims as any).primaryEmail)
  push((claims as any).email_address)

  const emails = (claims as any).email_addresses
  if (Array.isArray(emails)) {
    for (const e of emails) {
      if (typeof e === 'string') push(e)
      else push(e?.email_address)
    }
  }

  return Array.from(out)
}

export default defineEventHandler(async (event) => {
  // 1. Validar Autenticación de Clerk
  // Aseguramos que quien llama a este endpoint es un usuario legítimo logueado en Clerk
  const authValue = (event.context as any).auth
  const authContext = typeof authValue === 'function'
    ? await authValue()
    : authValue
  const { userId: clerkUserId, sessionClaims } = authContext || {}
  
  if (!clerkUserId) {
    return { error: 'Unauthorized', statusCode: 401 }
  }

  try {
    const body = await readBody(event)
    const claimEmails = extractEmailsFromClaims(sessionClaims)
    const bodyEmail = String(body?.email || '').trim().toLowerCase()
    const userEmail = claimEmails.length > 0 ? claimEmails[0] : bodyEmail
    
    if (!userEmail) {
      return { error: 'Email required' }
    }

    if (claimEmails.length > 0 && bodyEmail && !claimEmails.includes(bodyEmail)) {
      return { error: 'Email mismatch', statusCode: 403 }
    }

    const directusUrl = 'https://directus.jizou.io'
    // Explicación: Usamos credenciales de Admin (Token) para generar el token inicial del usuario.
    const adminToken = process.env.NUXT_DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN
    if (!adminToken) {
      return { error: 'Missing DIRECTUS_ADMIN_TOKEN', statusCode: 500 }
    }
    
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
        const userRole = 'a78c3ab5-20eb-451f-b93f-c087f500fb47'
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

      } catch (e: any) {
        console.error('[SYNC] Create failed:', e)
        return { error: 'Create user failed', details: e.message }
      }
    }

    try {
      const invitations = await adminClient.request(readItems('trip_invitations', {
        filter: {
          email: { _eq: userEmail },
          status: { _starts_with: 'pending' }
        },
        limit: -1
      })) as any[]

      for (const inv of invitations || []) {
        const invitationTripId = inv.trip_id
        if (!invitationTripId) continue

        const roleFromField = inv.role === 'read_only' ? 'read_only' : inv.role === 'editor' ? 'editor' : null
        const rawStatus = String(inv.status || '')
        const roleFromStatus = rawStatus.startsWith('pending_') ? rawStatus.replace('pending_', '') : null
        const tripRole = roleFromField || (roleFromStatus === 'read_only' ? 'read_only' : 'editor')

        const existingAssociation = await adminClient.request(readItems('trips_users', {
          filter: {
            _and: [
              { trip_id: { _eq: invitationTripId } },
              { directus_user_id: { _eq: directusUser.id } }
            ]
          },
          limit: 1
        })) as any[]

        if (!existingAssociation || existingAssociation.length === 0) {
          await adminClient.request(createItem('trips_users', {
            trip_id: invitationTripId,
            directus_user_id: directusUser.id,
            rol: tripRole,
            status: 'published'
          }))
        }

        try {
          await adminClient.request(deleteItem('trip_invitations', inv.id))
        } catch (e) {
          console.warn('[SYNC] Could not delete invitation after use:', e)
        }
      }
    } catch (e) {
      console.warn('[SYNC] Error processing invitations (skipping):', e)
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
