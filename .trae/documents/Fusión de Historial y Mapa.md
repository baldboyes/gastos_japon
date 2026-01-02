Voy a fusionar la funcionalidad de mapas en la página de historial (`history.vue`) y eliminar la página de mapa independiente.

### 1. Modificar `app/pages/history.vue`
- **Estado**: Agregar `viewMode` (ref: 'list' | 'map') para controlar la vista actual.
- **UI**: 
  - Añadir un botón en la cabecera para alternar entre "Ver Mapa" y "Ver Lista".
  - Integrar el componente `<MapsView />` (anteriormente usado en `map.vue`) que se mostrará cuando `viewMode === 'map'`.
  - Mantener la lista de gastos existente (`<ExpensesGroupedList />`) cuando `viewMode === 'list'`.
  - Asegurar que los filtros existentes (búsqueda, categoría, fecha, etc.) funcionen para ambas vistas.
- **Lógica**:
  - Implementar `handleMarkerClick` para abrir el detalle del gasto desde el mapa.
  - Asegurar que la vista de mapa solo reciba gastos con coordenadas válidas.

### 2. Eliminar `app/pages/map.vue`
- Una vez fusionada la funcionalidad, eliminaré este archivo ya que será redundante.

### 3. Actualizar Navegación
- Eliminar o redirigir cualquier enlace que apuntase a `/map` hacia `/history` (o simplemente eliminar la referencia en el menú si existe).

Este cambio centralizará la exploración de gastos en una sola pantalla más potente.
