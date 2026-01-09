# Mostrar "Creado por" en Alojamientos

Este plan tiene como objetivo visualizar qué usuario creó cada registro de alojamiento. Para ello, necesitamos asegurarnos de que el campo `user_created` se obtiene de la API y se muestra en la interfaz.

## 1. Actualización del Modelo de Datos
El campo `user_created` es un campo estándar del sistema Directus, pero no está tipado en nuestra interfaz TypeScript.

### A. Modificar `app/composables/useTripOrganization.ts`
*   Actualizar la interfaz `Alojamiento` para incluir:
    ```typescript
    user_created?: string | { first_name?: string, last_name?: string, email?: string }
    ```
    *Nota: Directus puede devolver solo el ID (string) o el objeto completo si usamos `fields` con relación.*

## 2. Ajuste de la Consulta API
Actualmente, `useTripOrganization` trae `*`. Para asegurarnos de obtener el nombre del usuario creador y no solo su ID, debemos expandir la relación.

### A. Modificar `fetchOrganizationData` en `useTripOrganization.ts`
*   Cambiar la consulta `readItems` para incluir `user_created.first_name` y `user_created.last_name` en el parámetro `fields`.
    *   Actual: `fields: ['*', 'adjuntos.directus_files_id.*']`
    *   Nuevo: `fields: ['*', 'adjuntos.directus_files_id.*', 'user_created.first_name', 'user_created.last_name']`

## 3. Actualización de la Interfaz de Usuario (UI)
Mostrar la información en la tarjeta de alojamiento.

### A. Modificar `app/pages/trips/[id]/accommodation.vue`
*   En la sección `<CardHeader>` o justo debajo del título/fechas:
    *   Añadir un pequeño texto o badge: "Creado por: [Nombre]".
    *   Usar una función helper simple para formatear el nombre (ej: `John D.`).

## Pasos de Ejecución
1.  Actualizar interfaz y consulta en `useTripOrganization.ts`.
2.  Actualizar template en `accommodation.vue` para mostrar el campo.
