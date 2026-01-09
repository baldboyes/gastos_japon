import { createDirectus, rest, createItem, readItems, readUsers, staticToken } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, tripId, tripName, inviterName, inviterId } = body

    if (!email || !tripId) {
      return { success: false, error: 'Missing required fields' }
    }

    const directusUrl = 'https://api.mevoyajapon.com'
    const adminToken = process.env.DIRECTUS_ADMIN_TOKEN || 'DirectusAdmin2026!'
    
    // Conectar como Admin
    const adminClient = createDirectus(directusUrl)
      .with(staticToken(adminToken))
      .with(rest())

    // 1. Buscar usuario por email (usando readUsers para colección de sistema)
    const users = await adminClient.request(readUsers({
      filter: {
        email: {
          _eq: email
        }
      },
      limit: 1
    }))

    const existingUser = users && users.length > 0 ? users[0] : null

    if (existingUser) {
      // Caso 1: Usuario existe -> Crear Notificación
      
      // Verificar si ya está asociado
      const existingAssociation = await adminClient.request(readItems('viajes_usuarios', {
        filter: {
          _and: [
            { viaje_id: { _eq: tripId } },
            { directus_user_id: { _eq: existingUser.id } }
          ]
        }
      }))

      if (existingAssociation && existingAssociation.length > 0) {
        return { success: false, error: 'User already in trip' }
      }

      await adminClient.request(createItem('notificaciones', {
        recipient_id: existingUser.id,
        user_created: inviterId, // El que invita
        title: `Invitación a viaje: ${tripName}`,
        message: `${inviterName} te ha invitado a unirte al viaje "${tripName}".`,
        type: 'invite',
        status: 'published',
        // Guardamos el tripId en action_link o podríamos usar un campo JSON 'metadata' si existiera
        // Usaremos action_link con un formato especial o query param para que el frontend sepa qué hacer
        action_link: `/trips/${tripId}/join?invite=true`
      }))

      return { success: true, status: 'invited', message: 'Invitación enviada al usuario.' }
    } else {
      // Caso 2: Usuario NO existe -> Simular envío de email
      // En un entorno real, aquí se llamaría a un servicio de email (SendGrid, Resend, etc.)
      
      console.log(`[MOCK EMAIL] To: ${email} | Subject: Únete a ${tripName} | Body: Hola, ${inviterName} te invita... Regístrate aquí: https://app.mevoyajapon.com/register`)

      return { success: true, status: 'email_sent', message: 'Usuario no registrado. Se ha enviado un correo de invitación.' }
    }

  } catch (error: any) {
    console.error('[INVITE] Error:', error)
    return { 
        success: false, 
        error: error.message || 'Internal Server Error'
    }
  }
})
