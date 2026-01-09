# Implementar Asociación de Trayectos a Pases de Transporte (Revisado)

Voy a implementar la funcionalidad para vincular un trayecto de transporte a un pase existente (ej. JR Pass). **Si se selecciona un pase, el precio del trayecto se anulará automáticamente (0 o oculto), ya que el coste está incluido.**

## 1. Actualización de Modelo de Datos (Directus)
*   **Acción del Usuario**: Crear campo `pase_id` en la colección `transportes` (Relación M2O a `transportes`).

## 2. Actualización de Tipos (`useTripOrganization.ts`)
*   Actualizar interfaz `Transporte` con `pase_id`.

## 3. Modificación de UI (`transport.vue`)
*   **Lógica de Precio**:
    *   Añadir un `watch` sobre el campo `pase_id` en el formulario.
    *   **Regla**: Si `pase_id` tiene valor (no es null), establecer `formData.precio = 0` y deshabilitar/ocultar el input de precio.
    *   Si se deselecciona el pase, permitir editar el precio de nuevo.
*   **Selector de Pase**: Añadir el `<Select>` de pases disponibles (filtrados por `categoria === 'pase'`).
*   **Visualización**: Mostrar indicador "Incluido en [Nombre Pase]" en la tarjeta del trayecto.

## 4. Refactorización
*   Migrar `transport.vue` para usar `useTripItemForm` y las nuevas utilidades de fecha (`dates.ts`), alineándolo con Vuelos y Alojamiento.

## Verificación
1.  Crear un pase (ej. "JR Pass").
2.  Crear un trayecto y seleccionarlo.
3.  Verificar que el precio se bloquea/pone a 0.
4.  Guardar y confirmar visualización.
