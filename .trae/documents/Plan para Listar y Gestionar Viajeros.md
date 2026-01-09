# Mostrar Lista de Viajeros y Permitir Expulsión

Este plan tiene como objetivo obtener y visualizar la lista de usuarios asociados a un viaje, permitiendo además al usuario actual (si tiene permisos) eliminar o "rechazar" a otros viajeros.

## 1. Actualizar `useTrips` (Lógica de Datos)

Necesitamos una función para obtener los viajeros de un viaje específico.

* **Nueva función** **`fetchTravelers(tripId)`**:

  * Hará una consulta a la colección `viajes_usuarios`.

  * Filtro: `viaje_id` igual al ID actual.

  * Campos (Deep Fetching): `id` (ID de la relación), `rol`, `status`, y datos anidados de `directus_user_id` (`id`, `first_name`, `last_name`, `email`, `avatar_url`).

## 2. Crear Endpoint de Eliminación (Backend)

Para eliminar a un viajero de forma segura, crearemos un endpoint en el servidor.

* **Endpoint**: `/api/trips/remove-traveler.post.ts`

* **Lógica**:

  * Verificar que el solicitante es dueño del viaje o es el propio usuario saliéndose.

  * Eliminar el registro en `viajes_usuarios`.

  * (Opcional) Enviar notificación al usuario eliminado.

## 3. Actualizar `travelers.vue` (Frontend)

Reemplazar el placeholder con la lista real.

* **Renderizado**: Iterar sobre la lista de viajeros obtenida.

* **Tarjeta de Usuario**:

  * Avatar (o iniciales).

  * Nombre y Rol (Dueño/Editor).

  * Botón "Eliminar" (visible solo si soy Owner y no soy yo mismo).

* **Integración**:

  * Llamar a `fetchTravelers` al montar.

  * Conectar botón Eliminar al nuevo endpoint.

## Pasos de Ejecución

1. Actualizar `useTrips.ts` con `fetchTravelers`.
2. Crear endpoint `/api/trips/remove-traveler.post.ts`.
3. Actualizar template y script en `travelers.vue`.

