# Plan: Selección de Aerolíneas desde JSON

El objetivo es reemplazar el campo de texto libre "Aerolínea" en el formulario de Vuelos por un selector con búsqueda (combobox) que utilice los datos del archivo `public/lineasaereas.json`.

## 1. Composable para Aerolíneas (`useAirlines.ts`)
Crearemos un composable simple para cargar y exponer los datos de las aerolíneas.
*   **Funcionalidad**: Fetch del JSON estático `/lineasaereas.json` al iniciar.
*   **Estado**: Lista reactiva de aerolíneas (`{ id, name, logo }`).
*   **Helper**: Función para buscar por nombre (aunque el combobox de UI lo hará visualmente).

## 2. Componente de UI: Combobox de Aerolíneas
Utilizaremos el componente `Command` (Combobox) de Shadcn para permitir buscar entre las miles de aerolíneas sin saturar el DOM.
*   **Componente**: `app/components/ui/AirlineSelector.vue`.
*   **Props**: `modelValue` (v-model para el nombre de la aerolínea).
*   **Visualización**: Mostrará el logo y el nombre de la aerolínea en la lista.

## 3. Integración en `TripLogistics.vue`
*   Reemplazar el `<Input v-model="formData.aerolinea" />` por el nuevo `<AirlineSelector v-model="formData.aerolinea" />`.
*   Guardar tanto el nombre como (opcionalmente) el logo si queremos mostrarlo luego en la lista de vuelos. *Nota: El esquema actual solo tiene `aerolinea` (string), así que guardaremos el nombre.*

## 4. Ejecución
1.  Crear `useAirlines.ts`.
2.  Instalar componentes de Shadcn necesarios para el Combobox (`Command`, `Popover`) si faltan.
3.  Crear el componente `AirlineSelector.vue`.
4.  Actualizar `TripLogistics.vue`.