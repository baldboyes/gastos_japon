# Plan de Optimización y Refactorización Nuxt

Este plan aborda la deuda técnica identificada y optimiza la estructura del proyecto siguiendo principios DRY y Clean Code.

## Fase 1: Extracción de Lógica Común (DRY)
Eliminaremos la duplicación de código detectada en 5 archivos principales.

1.  **Crear Utilidad de Agrupación (`utils/grouping.ts`)**:
    *   Extraer la lógica repetida de agrupación por fechas (presente en `accommodation`, `activities`, `flights`, `transport`, `itinerary`).
    *   Implementar `groupByDate(items, dateField)` para centralizar el formateo de fechas y ordenamiento.

2.  **Centralizar Lógica del Itinerario**:
    *   Modificar `useTripOrganization.ts` para incluir una propiedad computada `timelineEvents`.
    *   Esta propiedad normalizará Vuelos, Alojamientos, Transportes y Actividades en una estructura común (`TimelineEvent`), eliminando la lógica frágil y manual de `itinerary.vue`.

## Fase 2: Refactorización de Componentes y Páginas
Simplificaremos los componentes eliminando la lógica que ahora residirá en las utilidades y composables.

1.  **Refactorizar Páginas de Detalle**:
    *   Actualizar `accommodation.vue`, `activities.vue`, `transport.vue`, `flights.vue` para usar `groupByDate`.
    *   Esto reducirá ~20 líneas de código redundante por archivo.

2.  **Optimizar `itinerary.vue`**:
    *   Reemplazar la lógica manual de mapeo (transformar cada tipo de dato a evento) por el uso de `timelineEvents` del composable.
    *   Utilizar `groupByDate` para la visualización final.

3.  **Estandarizar Formularios**:
    *   Revisar `wallet.vue` y el formulario de gastos en `itinerary.vue` para ver si pueden beneficiarse de `useTripItemForm` o si se puede simplificar su gestión de estado para ser consistente con el resto de la app.

## Fase 3: Buenas Prácticas y Mantenibilidad

1.  **Tipado Estricto**: Asegurar que las nuevas utilidades y el composable refactorizado tengan tipos TypeScript explícitos (`TimelineEvent`, `GroupedItems`).
2.  **Documentación**: Añadir JSDoc a las nuevas funciones utilitarias y composables para facilitar el mantenimiento futuro.

## Fase 4: Verificación

1.  **Prueba de Regresión Visual**: Verificar que las listas en las páginas de Alojamiento, Transporte y Actividades se vean idénticas y respeten el orden cronológico.
2.  **Verificación Funcional**: Confirmar que el Itinerario muestra todos los eventos combinados correctamente.
3.  **Validación de Formularios**: Asegurar que la creación/edición de elementos sigue funcionando tras la refactorización.
