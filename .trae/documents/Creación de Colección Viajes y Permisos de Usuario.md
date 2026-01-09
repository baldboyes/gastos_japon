# Plan de Configuración de Datos: Viajes Colaborativos

Diseñaré la base de datos para soportar la creación simple ahora, pero con la arquitectura lista para invitar usuarios en el futuro.

## 1. Esquema de Datos
En lugar de una sola colección, usaremos dos para gestionar los accesos:

### A. Colección `viajes` (La entidad principal)
*   `id` (UUID)
*   `nombre` (Texto)
*   `fecha_inicio` (Fecha)
*   `fecha_fin` (Fecha)
*   `user_created` (Sistema): El dueño original.

### B. Colección `viajes_usuarios` (Tabla intermedia de permisos)
Esta es la clave para la colaboración futura. Relaciona usuarios con viajes y define su nivel de acceso.
*   `viaje_id` (Relación -> `viajes`)
*   `directus_users_id` (Relación -> Colección de usuarios del sistema)
*   `rol` (Texto): Valores como "owner", "editor", "viewer".

## 2. Lógica de Negocio (Directus Flows / Hooks)
Para que la "fase 1" (solo crear) sea sencilla, configuraré una automatización (Flow) en Directus:
*   **Al crear un viaje:** Directus insertará automáticamente un registro en `viajes_usuarios` asignando al creador el rol de "owner".

## 3. Seguridad y Permisos
Configuraré los permisos de la API basándome en la tabla intermedia:
*   **Lectura/Edición:** Un usuario puede ver/editar un viaje SI existe un registro en `viajes_usuarios` que vincule su ID con ese viaje (y tenga el rol adecuado).

**Ventaja:** Ahora mismo solo habrá 1 usuario por viaje (el creador). Mañana, solo tendrás que añadir registros a `viajes_usuarios` para invitar amigos, sin cambiar ni una línea de código en la estructura de la base de datos.

## 4. Ejecución
Crearé el script `setup_viajes_colaborativos.py` para implementar estas dos colecciones y configurar los permisos avanzados de una sola vez.
