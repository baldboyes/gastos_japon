# Implementación de Sistema de Alertas y Notificaciones

Este plan detalla la creación de un sistema de notificaciones persistentes que vincula usuarios (creador y receptor) y proporciona una interfaz para visualizarlas.

## 1. Modelo de Datos (Nueva Tabla)
Se definirá una nueva estructura de datos para la colección `notificaciones` en Directus.

### Estructura de la Colección: `notificaciones`
*   **`id`**: Identificador único (UUID o Auto-incremental).
*   **`status`**: Estado del registro (published, draft, archived).
*   **`date_created`**: Fecha de creación.
*   **`user_created`**: Usuario que crea la notificación (remitente).
*   **`recipient_id`**: Usuario que recibe la notificación (relación Many-to-One con `directus_users`).
*   **`title`**: Título breve de la alerta.
*   **`message`**: Contenido detallado.
*   **`type`**: Tipo de alerta (ej: 'info', 'warning', 'success', 'invite').
*   **`read_at`**: Fecha/hora de lectura (null si no leída).
*   **`action_link`**: (Opcional) URL interna para redirigir al usuario (ej: `/trips/123`).

## 2. Lógica de Negocio (Composable)
Crearemos un nuevo composable `~/composables/useNotifications.ts` para centralizar la lógica.

*   **Estado**: Lista de notificaciones, contador de no leídas.
*   **Funciones**:
    *   `fetchNotifications()`: Obtener alertas donde `recipient_id` sea el usuario actual.
    *   `markAsRead(id)`: Actualizar `read_at` con la fecha actual.
    *   `createNotification(payload)`: Crear una nueva alerta (para uso interno del sistema).
    *   `deleteNotification(id)`: Eliminar una alerta.

## 3. Interfaz de Usuario (UI)

### A. Página de Notificaciones (`/notifications`)
Una nueva página dedicada donde el usuario puede ver su historial de alertas.
*   Lista de tarjetas con título, mensaje y fecha.
*   Indicador visual para alertas no leídas.
*   Botón para "Marcar como leída" o eliminar.

### B. Indicador en el Layout (`layouts/default.vue`)
Integración en la navegación principal para acceso rápido.
*   Icono de campana (Bell) en la esquina superior derecha (posición fija).
*   Badge (punto rojo) con el número de notificaciones no leídas.
*   Al hacer clic, redirige a `/notifications`.

## Pasos de Implementación
1.  Crear el archivo del composable `useNotifications.ts`.
2.  Crear la página `pages/notifications/index.vue`.
3.  Modificar `layouts/default.vue` para agregar el icono de acceso directo.
4.  Verificar la integración con el sistema de autenticación existente (`useDirectus`) para asegurar que solo se carguen las notificaciones del usuario logueado.
