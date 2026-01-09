# Implementación de Gestión de Viajeros

Este plan detalla la implementación de la funcionalidad para invitar y gestionar viajeros en un viaje, cubriendo los escenarios de usuario existente y nuevo usuario.

## 1. Backend (API Server Routes)
Necesitamos dos endpoints seguros para manejar la lógica de negocio sin exponer credenciales de administrador en el cliente.

### A. Endpoint de Invitación (`/api/trips/invite`)
Este endpoint será el núcleo de la lógica.
*   **Input**: `email`, `tripId`, `tripName`, `inviterName`.
*   **Lógica**:
    1.  Validar que el usuario que solicita tiene permisos sobre el viaje (o es el creador).
    2.  Buscar el email en la colección `directus_users` (usando token de admin).
    3.  **Caso 1: Usuario Existe**
        *   Crear una notificación interna para ese usuario (`type: 'invite'`).
        *   Incluir en la notificación el `tripId` y `action_link` para aceptar/rechazar.
    4.  **Caso 2: Usuario NO Existe**
        *   Generar un email de invitación (simulado o vía servicio si disponible, por ahora se simulará la acción y se devolverá un estado específico al frontend).
        *   *Nota: Dado que no hay servicio de email configurado, simularemos el envío y mostraremos instrucciones para el registro.*
*   **Output**: `{ success: true, status: 'invited' | 'email_sent', message: '...' }`

### B. Endpoint de Respuesta (`/api/trips/respond-invite`)
Maneja la aceptación de la invitación.
*   **Input**: `notificationId`, `accept: boolean`.
*   **Lógica**:
    1.  Verificar que la notificación pertenece al usuario actual.
    2.  Si `accept === true`:
        *   Extraer `tripId` de la notificación.
        *   Crear registro en `viajes_usuarios` (rol: 'editor' o 'viewer').
    3.  Marcar la notificación como leída/archivada.
    4.  Crear notificación de vuelta al propietario indicando que aceptó.

## 2. Frontend (UI/UX)

### A. Página de Viajeros (`travelers.vue`)
Reemplazar el placeholder actual con:
*   **Lista de Viajeros**: Mostrar usuarios ya asociados (`viajes_usuarios`).
*   **Formulario de Invitación**:
    *   Input para email.
    *   Botón "Invitar".
    *   Validación de formato de email.
    *   Feedback en tiempo real (loading, success, error).

### B. Notificaciones (`notifications/index.vue`)
Mejorar la tarjeta de notificación para soportar el tipo `invite`.
*   Si `type === 'invite'`, mostrar botones **"Aceptar"** y **"Rechazar"** directamente en la tarjeta.
*   Conectar estos botones al endpoint `/api/trips/respond-invite`.

## 3. Seguridad
*   Todas las operaciones sensibles (búsqueda de usuarios por email, asociación de usuarios) se realizan en el servidor (`server/api`) usando el token de administrador, nunca desde el cliente.
*   El cliente solo envía intenciones ("quiero invitar a X").

## Pasos de Ejecución
1.  Crear endpoint `/api/trips/invite.post.ts`.
2.  Crear endpoint `/api/trips/respond-invite.post.ts`.
3.  Implementar la UI en `travelers.vue` usando `useFetch` para llamar al API.
4.  Actualizar `notifications/index.vue` para manejar la respuesta a invitaciones.
