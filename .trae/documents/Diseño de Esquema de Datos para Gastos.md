# Plan de Implementación: Esquema de Gastos

Procederé a ejecutar los cambios aprobados en Directus:

## 1. Actualizar Colección `viajes`
Añadiré los campos de presupuesto para soportar los datos del JSON:
- `presupuesto_diario` (Integer)
- `moneda` (String, Default: "JPY")

## 2. Crear Colección `gastos`
Crearé la nueva colección con la siguiente estructura:
- **Campos Core**: `fecha` (datetime), `concepto` (string), `monto` (integer), `categoria` (string), `descripcion` (text), `metodo_pago` (string), `es_compartido` (boolean).
- **Ubicación**: `ubicacion_lat`, `ubicacion_lng`, `ciudad`, `prefectura`.
- **Control**: `external_id` (unique) para evitar duplicados de importación.
- **Relaciones**:
  - `viaje_id`: M2O -> `viajes` (Required, Cascade Delete).
  - `user_created`: Campo de sistema (automático).

## 3. Configurar Permisos
- Configurar rol "App User" para permitir:
  - **Crear** gastos.
  - **Leer/Editar/Borrar** gastos donde el usuario sea el creador O colaborador del viaje asociado.

Una vez completado, la base de datos estará lista para recibir los datos del archivo JSON.